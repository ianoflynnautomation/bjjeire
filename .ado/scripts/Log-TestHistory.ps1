<#
.SYNOPSIS
    Fetches all Azure DevOps test results for a build and logs them to Azure Data Explorer (Kusto).
.DESCRIPTION
    This script uses the AdoTestAnalytics module to fetch test results and ingest them directly into a specified Azure Data Explorer database.
.NOTES
    Version: 5.0
    Author: 
    Depends on: AdoTestAnalytics.psm1 (which must contain Publish-TestResultsToADX)
.EXAMPLE
    ./Log-TestHistory.ps1 -Organization "my-org" -Project "my-project" -BuildId $(Build.BuildId) -Pat $env:SYSTEM_ACCESSTOKEN -KustoIngestionUri "..."
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
  [Parameter(Mandatory = $true)]
  [string]$KustoIngestionUri,
  [Parameter(Mandatory = $true)]
  [string]$KustoQueryUri,
  [Parameter(Mandatory = $true)]
  [string]$KustoDatabaseName,
  [Parameter(Mandatory = $true)]
  [string]$KustoTableName = 'TestResultHistory',
  [Parameter(Mandatory = $true)]
  [string]$KustoMappingName = 'TestResultHistory_Mapping',
  [Parameter(Mandatory = $true)]
  [string]$AppClientId,
  [Parameter(Mandatory = $true)]
  [string]$AppClientSecret,
  [Parameter(Mandatory = $true)]
  [string]$TenantId
)

adoHttpClient = $null
$adxAccessToken = $null
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

  # Get a dedicated access token for Azure Data Explorer
  $adxAccessToken = Get-AdxAccessToken -KustoClusterUri $KustoQueryUri -AppClientId $AppClientId -AppClientSecret $AppClientSecret -TenantId $TenantId

  # 2. Diagnostic Step
  Write-Host "Verifying ADX resources: Database '$KustoDatabaseName', Table '$KustoTableName'..."
  $tableExists = Test-AdxTableExists -AccessToken $adxAccessToken -QueryUri $KustoQueryUri -DatabaseName $KustoDatabaseName -TableName $KustoTableName
    
  if (-not $tableExists) {
    throw "Verification failed: Table '$KustoTableName' not found in database '$KustoDatabaseName'. Please check for typos or case-sensitivity issues in your pipeline variables and ADX resource names."
  }
  Write-Host "Verification successful. Target table found."

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
    Publish-TestResultsToADX `
        -Entities $allEntities `
        -IngestionUri $KustoIngestionUri `
        -DatabaseName $KustoDatabaseName `
        -TableName $KustoTableName `
        -MappingName $KustoMappingName `
        -AccessToken $adxAccessToken
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
