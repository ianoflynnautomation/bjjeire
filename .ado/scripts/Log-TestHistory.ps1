<#
.SYNOPSIS
    Fetches all Azure DevOps test results for a build and logs them to Azure Table Storage.
.DESCRIPTION
    This script uses the AdoTestAnalytics module to perform its operations. It's designed to be run within an Azure DevOps pipeline.
.NOTES
    Version: 4.0
    Author:
    Depends on: AdoTestAnalytics.psm1
.PARAMETER Organization
    Your Azure DevOps organization name.
.PARAMETER Project
    Your Azure DevOps project name.
.PARAMETER BuildId
    The ID of the build to process.
.PARAMETER Pat
    A Personal Access Token (PAT) or the System.AccessToken for authentication.
.PARAMETER StorageConnectionString
    The connection string for the Azure Storage Account where the "TestResultHistory" table exists.
.EXAMPLE
    ./Log-TestHistory.ps1 -Organization "my-org" -Project "my-project" -BuildId $(Build.BuildId) -Pat $env:SYSTEM_ACCESSTOKEN -StorageConnectionString "your-connection-string"
#>
[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]$Organization,

  [Parameter(Mandatory = $true)]
  [string]$Project,

  [Parameter(Mandatory = $true)]
  [int]$BuildId,

  [Parameter(Mandatory = $true)]
  [string]$Pat,

  [Parameter(Mandatory = $true)]
  [string]$StorageConnectionString,

  [Parameter(Mandatory = $false)]
  [string]$ApiVersion = '7.1',

  [Parameter(Mandatory = $false)]
  [string]$TableName = 'TestResultHistory',

  [Parameter(Mandatory = $false)]
  [int]$BatchSize = 100
)

# --- Main Script Workflow ---
$startTime = [System.Diagnostics.Stopwatch]::StartNew()
$httpClient = $null

try {

  $modulePath = Join-Path $PSScriptRoot "..\Modules\AdoTestAnalytics\AdoTestAnalytics.psm1"
  Write-Host "Importing module from: $modulePath"
  Import-Module -Name $modulePath -Force
  Import-Module -Name Az.Storage -ErrorAction Stop
  Import-Module -Name AzTable -ErrorAction Stop
    
  Write-Host "Initializing HttpClient for asynchronous API calls..."
  Add-Type -AssemblyName System.Net.Http
  $httpClient = [System.Net.Http.HttpClient]::new()
  $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)
  $httpClient.DefaultRequestHeaders.Add("Accept", "application/json")

  Write-Host "Verifying Azure Storage Table '$TableName'..."
  $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString
  $tableRef = Get-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction SilentlyContinue
  if (-not $tableRef) {
    Write-Host "Table '$TableName' not found. Creating it..."
    $tableRef = New-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction Stop
  }
  $cloudTable = $tableRef.CloudTable

  # 2. Fetch Data from Azure DevOps
  Write-Host "Fetching test runs for Build ID $BuildId..."
  $testRuns = Get-AdoTestRuns -HttpClient $httpClient -Organization $Organization -Project $Project -BuildId $BuildId -ApiVersion $ApiVersion
    
  if (-not $testRuns) {
    Write-Host "No test runs found for Build ID $BuildId. Exiting gracefully."
    Write-Host "##vso[task.setvariable variable=TestRunCount]0"
    Write-Host "##vso[task.complete result=Succeeded]"
    exit 0
  }
  Write-Host "Found $($testRuns.Count) test runs."
  Write-Host "##vso[task.setvariable variable=TestRunCount]$($testRuns.Count)"

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
      $entity = ConvertTo-TestResultEntity -Result $result -Run $run -BuildId $BuildId
      $allEntities.Add($entity)
    }
  }

  # 4. Publish Data to Azure Table Storage
  if ($allEntities.Count -gt 0) {
    Write-Host "Total test result entities to upload: $($allEntities.Count)."
    Write-Host "##vso[task.setvariable variable=EntityCount]$($allEntities.Count)"
    Publish-TestResultEntities -CloudTable $cloudTable -Entities $allEntities -BatchSize $BatchSize
  }
  else {
    Write-Host "No test results were found to log."
    Write-Host "##vso[task.setvariable variable=EntityCount]0"
  }

  # 5. Finalize
  $startTime.Stop()
  $durationMs = $startTime.Elapsed.TotalMilliseconds
  Write-Host "##vso[task.setvariable variable=ScriptDurationMs]$durationMs"
  Write-Host "Script completed successfully in $($startTime.Elapsed.TotalSeconds) seconds."
  Write-Host "##vso[task.complete result=Succeeded]"
}
catch {
  Write-Host "##vso[task.logissue type=error;]A critical error occurred: $($_.Exception.Message)"
  Write-Host "##vso[task.logissue type=error;]$($_.ScriptStackTrace)"
  Write-Host "##vso[task.complete result=Failed]"
  exit 1
}
finally {
  if ($null -ne $httpClient) {
    Write-Host "##vso[task.debug]Disposing HttpClient."
    $httpClient.Dispose()
  }
}
