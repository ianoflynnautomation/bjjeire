<#
.SYNOPSIS
    Fetches all Azure DevOps test results for a build and logs them to Azure Data Explorer (Kusto) using the Az.Kusto module.
.NOTES
    Version: 6.0 (Az.Kusto Auth)
    Author: 
    Depends on: AdoTestAnalytics.psm1
    Changes in v6.0:
    - Authenticates to Azure using a Service Principal via Connect-AzAccount.
    - Calls the updated Publish-TestResultsToADX function which uses Invoke-AzKustoIngest.
#>
[CmdletBinding()]
param (
  # --- Azure DevOps Parameters ---
  [Parameter(Mandatory = $true)]
  [string]$Organization,
  [Parameter(Mandatory = $true)]
  [string]$Project,
  [Parameter(Mandatory = $true)]
  [int]$BuildId,
  [Parameter(Mandatory = $true)]
  [string]$Pat,
  [Parameter(Mandatory = $false)]
  [string]$ApiVersion = '7.1',

  # --- Azure Data Explorer (Kusto) Parameters ---
  [Parameter(Mandatory = $true)]
  [string]$KustoClusterName, # e.g., "testresults-dev-sn-dec"
  [Parameter(Mandatory = $true)]
  [string]$KustoDatabaseName, # e.g., "TestAnalyticsDb"
  [Parameter(Mandatory = $true)]
  [string]$KustoTableName = 'TestResultHistory',
  [Parameter(Mandatory = $true)]
  [string]$KustoMappingName = 'TestResultHistory_Mapping',

  # --- Service Principal Credentials for Azure Authentication ---
  [Parameter(Mandatory = $true)]
  [string]$AppClientId,
  [Parameter(Mandatory = $true)]
  [string]$AppClientSecret,
  [Parameter(Mandatory = $true)]
  [string]$TenantId,
  [int]$RunBatchSize = 100
)

$adoHttpClient = $null
$startTime = [System.Diagnostics.Stopwatch]::StartNew()

try {

  Install-Module PowerShellKusto -Scope CurrentUser
  
  # 1. Initialization
  Write-Host "Script starting..."
  $modulePath = Join-Path $PSScriptRoot "..\Modules\AdoTestAnalytics\AdoTestAnalytics.psm1"
  Write-Host "Importing module from: $modulePath"
  Import-Module -Name $modulePath -Force
    
  # Create a client for Azure DevOps
  Write-Host "Initializing HttpClient for Azure DevOps API calls..."
  $adoHttpClient = [System.Net.Http.HttpClient]::new()
  $adoHttpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)
  $adoHttpClient.DefaultRequestHeaders.Add("Accept", "application/json")

  # 2. Authenticate to Azure using the Service Principal
  Write-Host "Authenticating to Azure with Service Principal..."
  $secureClientSecret = ConvertTo-SecureString -String $AppClientSecret -AsPlainText -Force
  $credential = New-Object System.Management.Automation.PSCredential($AppClientId, $secureClientSecret)
  Connect-AzAccount -ServicePrincipal -Credential $credential -Tenant $TenantId | Out-Null
  Write-Host "Successfully authenticated to Azure."

  # 3. Fetch Data from Azure DevOps
  Write-Host "Fetching test runs for Build ID $BuildId..."
  $testRuns = Get-AdoTestRuns -HttpClient $adoHttpClient -Organization $Organization -Project $Project -BuildId $BuildId -ApiVersion $ApiVersion
    
  if (-not $testRuns) {
    Write-Warning "No test runs found for Build ID $BuildId. Exiting gracefully."
    exit 0
  }
  Write-Host "Found $($testRuns.Count) test runs. Processing in batches of $RunBatchSize."

  # 4. Process and Publish Data in Batches
  $totalEntitiesProcessed = 0
  for ($i = 0; $i -lt $testRuns.Count; $i += $RunBatchSize) {
    $runBatch = $testRuns | Select-Object -Skip $i -First $RunBatchSize
    $batchNum = ($i / $RunBatchSize) + 1
    $batchStartTime = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host "--- Processing Run Batch $batchNum of $([math]::Ceiling($testRuns.Count / $RunBatchSize)) ---"

    $allEntitiesInBatch = [System.Collections.Generic.List[object]]::new()
    foreach ($run in $runBatch) {
      if ($run.name -like '*Aggregated*') {
        Write-Host "##vso[task.debug]Skipping aggregated run '$($run.name)' (ID: $($run.id))."
        continue
      }
      Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
      $resultsForRun = Get-AdoTestResultsForRun -HttpClient $adoHttpClient -Organization $Organization -Project $Project -Run $run -ApiVersion $ApiVersion
      Write-Host "  - Found $($resultsForRun.Count) results for run ID $($run.id)."
      foreach ($result in $resultsForRun) {
        $entity = ConvertTo-TestResultEntity -Result $result -Run $run -BuildId $BuildId
        $allEntitiesInBatch.Add($entity)
      }
    }

    if ($allEntitiesInBatch.Count -gt 0) {
      Write-Host "Total test result entities in this batch to upload to Kusto: $($allEntitiesInBatch.Count)."
      $totalEntitiesProcessed += $allEntitiesInBatch.Count
      # This function now uses Invoke-AzKustoIngest internally
      Publish-TestResultsToADX `
          -Entities $allEntitiesInBatch `
          -KustoClusterName $KustoClusterName `
          -DatabaseName $KustoDatabaseName `
          -TableName $KustoTableName `
          -MappingName $KustoMappingName
    }
    else {
      Write-Host "No test results were found to log in this batch."
    }
    $batchStartTime.Stop()
    Write-Host "##vso[task.debug]Batch $batchNum completed in $($batchStartTime.Elapsed.TotalSeconds) seconds."
  }
  
  Write-Host "---"
  Write-Host "Total entities processed across all batches: $totalEntitiesProcessed"

  # 5. Finalize
  $startTime.Stop()
  Write-Host "Script completed successfully in $($startTime.Elapsed.TotalSeconds) seconds."
}
catch {
  Write-Host "##vso[task.logissue type=error;]A critical error occurred: $($_.Exception.Message)"
  Write-Host "##vso[task.logissue type=error;]$($_.ScriptStackTrace)"
  exit 1
}
finally {
  if ($null -ne $adoHttpClient) { $adoHttpClient.Dispose() }
  Write-Host "##vso[task.debug]Script finished. Total execution time: $($startTime.Elapsed.TotalSeconds) seconds."
}