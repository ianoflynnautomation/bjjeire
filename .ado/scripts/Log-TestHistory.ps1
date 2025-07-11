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
  # --- Azure Data Explorer (Kusto) Ingestion Parameters ---
  [Parameter(Mandatory = $true)]
  [string]$KustoIngestionUri, # e.g., "https://ingest-testresults-dev-sn-dec.switzerlandnorth.kusto.windows.net"
  [Parameter(Mandatory = $true)]
  [string]$KustoDatabaseName, # e.g., "TestAnalyticsDb"
  [Parameter(Mandatory = $true)]
  [string]$KustoTableName = 'TestResultHistory',
  [Parameter(Mandatory = $true)]
  [string]$KustoMappingName = 'TestResultHistory_Mapping'
)

# --- Main Script Workflow ---
$startTime = [System.Diagnostics.Stopwatch]::StartNew()
$httpClient = $null

try {
  # 1. Initialization
  $modulePath = Join-Path $PSScriptRoot "..\Modules\AdoTestAnalytics\AdoTestAnalytics.psm1"
  Write-Host "Importing module from: $modulePath"
  Import-Module -Name $modulePath -Force
    
  Write-Host "Initializing HttpClient for API calls..."
  Add-Type -AssemblyName System.Net.Http
  $httpClient = [System.Net.Http.HttpClient]::new()
  # The PAT provides authentication for both Azure DevOps and ADX ingestion
  $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)
  $httpClient.DefaultRequestHeaders.Add("Accept", "application/json")

  # 2. Fetch Data from Azure DevOps
  Write-Host "Fetching test runs for Build ID $BuildId..."
  $testRuns = Get-AdoTestRuns -HttpClient $httpClient -Organization $Organization -Project $Project -BuildId $BuildId -ApiVersion $ApiVersion
    
  if (-not $testRuns) {
    Write-Host "No test runs found for Build ID $BuildId. Exiting gracefully."
    exit 0
  }
  Write-Host "Found $($testRuns.Count) test runs."

  # 3. Process and Transform Data
  $allEntities = [System.Collections.Generic.List[object]]::new()
  foreach ($run in $testRuns) {
    if ($run.name -like '*Aggregated*') {
      Write-Host "##vso[task.debug]Skipping aggregated run '$($run.name)' (ID: $($run.id))."
      continue
    }
    Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
    $resultsForRun = Get-AdoTestResultsForRun -HttpClient $httpClient -Organization $Organization -Project $Project -Run $run -ApiVersion $ApiVersion
    foreach ($result in $resultsForRun) {
      # This function must exist in your AdoTestAnalytics.psm1 module
      $entity = ConvertTo-TestResultEntity -Result $result -Run $run -BuildId $BuildId
      $allEntities.Add($entity)
    }
  }

  # 4. Publish Data to Azure Data Explorer
  if ($allEntities.Count -gt 0) {
    Write-Host "Total test result entities to upload to Kusto: $($allEntities.Count)."
    # This function must exist in your AdoTestAnalytics.psm1 module
    Publish-TestResultsToADX `
      -Entities $allEntities `
      -IngestionUri $KustoIngestionUri `
      -DatabaseName $KustoDatabaseName `
      -TableName $KustoTableName `
      -MappingName $KustoMappingName `
      -HttpClient $httpClient
  }
  else {
    Write-Host "No test results were found to log."
  }

  # 5. Finalize
  $startTime.Stop()
  $durationMs = $startTime.Elapsed.TotalMilliseconds
  Write-Host "Script completed successfully in $($startTime.Elapsed.TotalSeconds) seconds."
}
catch {
  Write-Host "##vso[task.logissue type=error;]A critical error occurred: $($_.Exception.Message)"
  Write-Host "##vso[task.logissue type=error;]$($_.ScriptStackTrace)"
  exit 1
}
finally {
  if ($null -ne $httpClient) {
    Write-Host "##vso[task.debug]Disposing HttpClient."
    $httpClient.Dispose()
  }
}
