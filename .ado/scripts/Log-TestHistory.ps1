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
  [string]$TenantId
)

$adoHttpClient = $null
$startTime = [System.Diagnostics.Stopwatch]::StartNew()

try {
  # 1. Initialization
  $modulePath = Join-Path $PSScriptRoot "..\Modules\AdoTestAnalytics\AdoTestAnalytics.psm1"
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
    Write-Host "No test runs found for Build ID $BuildId. Exiting gracefully."
    exit 0
  }
  Write-Host "Found $($testRuns.Count) test runs."

  # 4. Process and Transform Data
  $allEntities = [System.Collections.Generic.List[object]]::new()
  foreach ($run in $testRuns) {
    if ($run.name -like '*Aggregated*') {
      Write-Host "##vso[task.debug]Skipping aggregated run '$($run.name)' (ID: $($run.id))."
      continue
    }
    Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
    $resultsForRun = Get-AdoTestResultsForRun -HttpClient $adoHttpClient -Organization $Organization -Project $Project -Run $run -ApiVersion $ApiVersion
    foreach ($result in $resultsForRun) {
      $entity = ConvertTo-TestResultEntity -Result $result -Run $run -BuildId $BuildId
      $allEntities.Add($entity)
    }
  }

  # 5. Publish Data to Azure Data Explorer
  if ($allEntities.Count -gt 0) {
    Write-Host "Total test result entities to upload to Kusto: $($allEntities.Count)."
    # This function now uses Invoke-AzKustoIngest internally
    Publish-TestResultsToADX `
        -Entities $allEntities `
        -KustoClusterName $KustoClusterName `
        -DatabaseName $KustoDatabaseName `
        -TableName $KustoTableName `
        -MappingName $KustoMappingName
  }
  else {
    Write-Host "No test results were found to log."
  }

  # 6. Finalize
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
}
