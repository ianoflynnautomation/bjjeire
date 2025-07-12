<#
.SYNOPSIS
    Fetches Azure DevOps test results for a build and ingests them into Azure Data Explorer.
.DESCRIPTION
    This script orchestrates the process of fetching test results via the Azure DevOps API and
    publishing them to a specified ADX (Kusto) database using a managed identity or service principal.
    It leverages the AdoTestAnalytics and AdoAutomationCore modules for all heavy lifting.
.NOTES
    Version:
    Author:
.EXAMPLE
    ./Log-TestHistory.ps1 -Organization "my-org" -Project "my-project" -KustoClusterUri "https://ingest-mycluster.kusto.windows.net" ...
#>
[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)][string]$Organization,
  [Parameter(Mandatory = $true)][string]$Project,
  [Parameter(Mandatory = $true)][string]$AdoPat,
  [Parameter(Mandatory = $true)][string]$KustoClusterUri,
  [Parameter(Mandatory = $true)][string]$KustoDatabaseName,
  [Parameter(Mandatory = $true)][string]$KustoTableName = 'TestResultHistory',
  [Parameter(Mandatory = $true)][string]$KustoMappingName = 'TestResultHistory_Mapping',
  [Parameter(Mandatory = $true)][string]$AppClientId,
  [Parameter(Mandatory = $true)][string]$AppClientSecret,
  [Parameter(Mandatory = $true)][string]$TenantId,
  [Parameter(Mandatory = $false)][int]$BuildId = $env:BUILD_BUILDID,
  [Parameter(Mandatory = $false)][string]$BuildReason = $env:BUILD_REASON,
  [Parameter(Mandatory = $false)][string]$CommitId = $env:BUILD_SOURCEVERSION,
  [Parameter(Mandatory = $false)][string]$RequestedForEmail = $env:BUILD_REQUESTEDFOREMAIL,
  [Parameter(Mandatory = $false)][string]$SourceBranch = $env:BUILD_SOURCEBRANCHNAME,
  [Parameter(Mandatory = $false)][string]$AgentName = $env:AGENT_NAME,
  [Parameter(Mandatory = $false)][string]$AdoApiVersion = '7.1'
)

$startTime = [System.Diagnostics.Stopwatch]::StartNew()
$adoHttpClient = $null
$adxHttpClient = $null

try {
  # 1. Initialization
  Write-Host "Initializing modules and HTTP clients..."
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoAutomationCore\AdoAutomationCore.psm1") -Force
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoTestAnalytics\AdoTestAnalytics.psm1") -Force

  $adoHttpClient = New-AdoHttpClient -AccessToken $AdoPat
  $adxAccessToken = Get-AdxAccessToken -KustoClusterUri $KustoClusterUri -AppClientId $AppClientId -AppClientSecret $AppClientSecret -TenantId $TenantId
  $adxHttpClient = New-AdoHttpClient -AccessToken $adxAccessToken

  # 2. Fetch Data from Azure DevOps
  Write-Host "Fetching test runs for Build ID: $BuildId..."
  $testRuns = Get-AdoTestRuns -HttpClient $adoHttpClient -Organization $Organization -Project $Project -BuildId $BuildId -ApiVersion $AdoApiVersion

  if (-not $testRuns) {
    Write-Host "No test runs found for Build ID $BuildId. Exiting gracefully."
    exit 0
  }
  Write-Host "Found $($testRuns.Count) test runs."

  # 3. Process and Transform Data
  $context = @{
    BuildId           = $BuildId
    BuildReason       = $BuildReason
    CommitId          = $CommitId
    RequestedForEmail = $RequestedForEmail
    SourceBranch      = $SourceBranch
    AgentName         = $AgentName
  }
  $allTestResults = Get-AdoTestResults -HttpClient $adoHttpClient -Organization $Organization -Project $Project -TestRuns $testRuns -Context $context -ApiVersion $AdoApiVersion

  # 4. Publish Data to Azure Data Explorer
  if ($allTestResults.Count -gt 0) {
    Write-Host "Total test results to upload: $($allTestResults.Count)."
    $publishParams = @{
      HttpClient   = $adxHttpClient
      Entities     = $allTestResults
      IngestionUri = $KustoClusterUri
      DatabaseName = $KustoDatabaseName
      TableName    = $KustoTableName
      MappingName  = $KustoMappingName
    }
    Publish-TestResultsToADX @publishParams
  }
  else {
    Write-Host "No individual test results were found to log after processing."
  }
}
catch {
  Write-Host "##vso[task.logissue type=error;]A critical error occurred in Log-TestHistory.ps1: $($_.Exception.Message)"
  Write-Host "##vso[task.logissue type=error;]$($_.ScriptStackTrace)"
  exit 1
}
finally {
  # 5. Finalize
  if ($null -ne $adoHttpClient) { $adoHttpClient.Dispose() }
  if ($null -ne $adxHttpClient) { $adxHttpClient.Dispose() }
  $startTime.Stop()
  Write-Host "Script completed in $($startTime.Elapsed.TotalSeconds) seconds."
}