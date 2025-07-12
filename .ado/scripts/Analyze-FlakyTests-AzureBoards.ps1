<#
.SYNOPSIS
    Analyzes test history from Kusto to create or resolve work items for flaky tests.
.DESCRIPTION
    This script connects to Azure Data Explorer to identify flaky tests based on predefined thresholds.
    It then synchronizes these findings with Azure Boards by creating new bugs for newly detected
    flakiness and automatically resolving bugs for tests that are now stable.
    It depends on the AdoAutomationCore and AdoWorkItemManagement modules.
.NOTES
    Version: 4.0
    Author: Staff SDET
.EXAMPLE
    ./Analyze-And-Manage-Flaky-Tests.ps1 -Organization "my-org" -Project "my-project" ...
#>
[CmdletBinding()]
param (
  # --- Azure DevOps & Context Parameters ---
  [Parameter(Mandatory = $true)][string]$Organization,
  [Parameter(Mandatory = $true)][string]$Project,
  [Parameter(Mandatory = $true)][string]$AdoPat,
  [Parameter(Mandatory = $true)][string]$AreaPath,
  [Parameter(Mandatory = $false)][string]$RepoName,
  [Parameter(Mandatory = $false)][string]$TestHealthDashboardUrl,
  [Parameter(Mandatory = $false)][string]$AdoApiVersion = '7.1',

  # --- Azure Data Explorer (Kusto) Parameters ---
  [Parameter(Mandatory = $true)][string]$KustoClusterUri, # e.g., "https://yourcluster.kusto.windows.net"
  [Parameter(Mandatory = $true)][string]$KustoDatabaseName,
  [Parameter(Mandatory = $true)][string]$AppClientId,
  [Parameter(Mandatory = $true)][string]$AppClientSecret,
  [Parameter(Mandatory = $true)][string]$TenantId,

  # --- Analysis Thresholds for KQL Query ---
  [Parameter(Mandatory = $false)][int]$TimeWindowDays = 14,
  [Parameter(Mandatory = $false)][double]$FlakinessThreshold = 0.01,
  [Parameter(Mandatory = $false)][int]$MinRunsThreshold = 20,
  [Parameter(Mandatory = $false)][int]$MinFlipsThreshold = 2,
  [Parameter(Mandatory = $false)][double]$DurationStdDevFactor = 2.5
)

$startTime = [System.Diagnostics.Stopwatch]::StartNew()
$adoHttpClient = $null
$adxHttpClient = $null

try {
  # 1. Initialization
  Write-Host "Initializing modules and HTTP clients..."
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoAutomationCore\AdoAutomationCore.psm1") -Force
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoWorkItemManagement\AdoWorkItemManagement.psm1") -Force
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoTestAnalytics\AdoTestAnalytics.psm1") -Force

  # ... (rest of the script logic from lines 38-124 is unchanged)

  # --- Create new bugs ---
  foreach ($flakyTest in $currentlyFlakyTests) {
    $bugExists = $existingBugs | Where-Object { $_.fields.'System.Title' -like "*$($flakyTest.TestName)*" -and $_.fields.'System.State' -notin ('Resolved', 'Closed', 'Done') }
    if (-not $bugExists) {
      Write-Host "##vso[task.logissue type=warning]CREATING new bug for flaky test: $($flakyTest.TestName)"

      # Use the function from the imported module
      $bugDescription = Get-FlakyTestBugDescription -FlakyTest $flakyTest -Organization $Organization -Project $Project -RepoName $RepoName -DashboardUrl $TestHealthDashboardUrl
            
      $newBugParams = @{
        HttpClient      = $adoHttpClient
        Organization    = $Organization
        Project         = $Project
        TestName        = $flakyTest.TestName
        Description     = $bugDescription
        AreaPath        = $AreaPath
        Tags            = "FlakyTest; Automated; Quarantined"
        AssignedToEmail = $flakyTest.FirstFailure.RequestedForEmail
        ApiVersion      = $AdoApiVersion
      }
      New-AdoBugForFlakyTest @newBugParams
    }
  }

  # --- Resolve stale bugs ---
  foreach ($bug in $existingBugs) {
    $testNameInTitle = $bug.fields.'System.Title' -replace '^\[Flaky Test\] '
    $isStillFlaky = $currentlyFlakyTests | Where-Object { $_.TestName -eq $testNameInTitle }
    if (-not $isStillFlaky -and $bug.fields.'System.State' -in @('New', 'Active', 'To Do')) {
      Write-Host "##vso[task.logissue type=warning]RESOLVING stale bug #$($bug.id) for test: $testNameInTitle"
            
      $mttr = (Get-Date) - ([datetime]$bug.fields.'System.CreatedDate')
      $comment = "Test is no longer flaky based on analysis over the last $TimeWindowDays days. Automatically resolved by pipeline. MTTR: $($mttr.Days) days."
      $resolveBugParams = @{
        HttpClient   = $adoHttpClient
        Organization = $Organization
        WorkItemId   = $bug.id
        State        = "Done"
        Comment      = $comment
        Tags         = ($bug.fields.'System.Tags' -replace 'Quarantined;? ?', '')
        ApiVersion   = $AdoApiVersion
      }
      Update-AdoWorkItemState @resolveBugParams
    }
  }
  Write-Host "Azure Boards synchronization complete."
}
catch {
  Write-Host "##vso[task.logissue type=error;]A critical error occurred in Analyze-FlakyTests-AzureBoards.ps1: $($_.Exception.Message)"
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
