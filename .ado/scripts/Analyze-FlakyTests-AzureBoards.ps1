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
    Author:
.EXAMPLE
    ./Analyze-And-Manage-Flaky-Tests.ps1 -Organization "my-org" -Project "my-project" ...
#>
[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)][string]$Organization,
  [Parameter(Mandatory = $true)][string]$Project,
  [Parameter(Mandatory = $true)][string]$AdoPat,
  [Parameter(Mandatory = $true)][string]$AreaPath,
  [Parameter(Mandatory = $false)][string]$RepoName,
  [Parameter(Mandatory = $false)][string]$TestHealthDashboardUrl,
  [Parameter(Mandatory = $false)][string]$AdoApiVersion = '7.1',
  [Parameter(Mandatory = $true)][string]$KustoClusterUri,
  [Parameter(Mandatory = $true)][string]$KustoDatabaseName,
  [Parameter(Mandatory = $true)][string]$AppClientId,
  [Parameter(Mandatory = $true)][string]$AppClientSecret,
  [Parameter(Mandatory = $true)][string]$TenantId,
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

  $adoHttpClient = New-AdoHttpClient -AccessToken $AdoPat
  $adxAccessToken = Get-AdxAccessToken -KustoClusterUri $KustoClusterUri -AppClientId $AppClientId -AppClientSecret $AppClientSecret -TenantId $TenantId
  $adxHttpClient = New-AdoHttpClient -AccessToken $adxAccessToken

  # 2. Define and Execute KQL Query to Find Flaky Tests
  Write-Host "Executing KQL query to find flaky tests over the last $($TimeWindowDays) days..."
  $kqlQuery = @"
TestResultHistory
| where Timestamp > ago($($TimeWindowDays)d)
| summarize TotalRuns = count(),
            PassedRuns = countif(Outcome == "Passed"),
            FailedRuns = countif(Outcome == "Failed"),
            Durations = make_list(DurationMs),
            History = make_list(pack('Timestamp', Timestamp, 'Outcome', Outcome)),
            FirstFailure = arg_min(iif(Outcome == 'Failed', Timestamp, datetime(null)), pack_all()),
            LastFailure = arg_max(iif(Outcome == 'Failed', Timestamp, datetime(null)), pack_all()),
            LastGoodRun = arg_max(iif(Outcome == 'Passed', Timestamp, datetime(null)), pack_all())
            by TestName
| where TotalRuns > $MinRunsThreshold and FailedRuns > 0
| extend FlipRate = todouble(FailedRuns) / TotalRuns, Flips = FailedRuns
| extend DurationStats = series_stats_dynamic(Durations)
| extend DurationAvg = todouble(DurationStats.avg), DurationStdDev = todouble(DurationStats.stdev)
| where (FlipRate >= $FlakinessThreshold and Flips >= $MinFlipsThreshold)
    or (isnotnull(DurationAvg) and DurationAvg > 50 and DurationStdDev > (DurationAvg * $DurationStdDevFactor))
| extend Reasons = pack_array(
    iif(FlipRate >= $FlakinessThreshold and Flips >= $MinFlipsThreshold, strcat('High flip rate (', tostring(toint(FlipRate*100)), '%)'), dynamic(null)),
    iif(isnotnull(DurationAvg) and DurationAvg > 50 and DurationStdDev > (DurationAvg * $DurationStdDevFactor), strcat('Unstable execution time (Avg: ', toint(DurationAvg), 'ms, StdDev: ', toint(DurationStdDev), 'ms)'), dynamic(null))
  )
| project TestName, Reasons, FirstFailure, LastFailure, LastGoodRun, History
"@

  $queryPayload = @{ db = $KustoDatabaseName; csl = $kqlQuery } | ConvertTo-Json
  $queryUrl = "$KustoClusterUri/v2/rest/query"
  $kustoResult = Invoke-ResilientRestMethod -HttpClient $adxHttpClient -Uri $queryUrl -Method 'POST' -Body $queryPayload

  # 3. Parse Kusto Results
  $currentlyFlakyTests = [System.Collections.Generic.List[PSObject]]::new()
  if ($kustoResult.Tables[0].Rows) {
    $currentlyFlakyTests = $kustoResult.Tables[0].Rows | ForEach-Object {
      [PSCustomObject]@{
        TestName     = $_[0]
        Reasons      = $_[1] | ConvertFrom-Json
        FirstFailure = $_[2] | ConvertFrom-Json
        LastFailure  = $_[3] | ConvertFrom-Json
        LastGoodRun  = $_[4] | ConvertFrom-Json
        HistoryText  = ($_[-1] | ConvertFrom-Json | Sort-Object Timestamp).Outcome -join ', '
      }
    }
  }
  Write-Host "Analysis complete. Found $($currentlyFlakyTests.Count) flaky tests."

  # 4. Synchronize with Azure Boards
  Write-Host "Fetching existing flaky test bugs from Azure Boards..."
  $getBugsParams = @{
    HttpClient   = $adoHttpClient
    Organization = $Organization
    Project      = $Project
    Tag          = "FlakyTest"
    ApiVersion   = $AdoApiVersion
  }
  $existingBugs = Get-AdoWorkItemsByTag @getBugsParams

  # --- Create new bugs ---
  foreach ($flakyTest in $currentlyFlakyTests) {
    $bugExists = $existingBugs | Where-Object { $_.fields.'System.Title' -like "*$($flakyTest.TestName)*" -and $_.fields.'System.State' -notin ('Resolved', 'Closed', 'Done') }
    if (-not $bugExists) {
      Write-Host "##vso[task.logissue type=warning]CREATING new bug for flaky test: $($flakyTest.TestName)"
            
      # Call the helper function from the module to build the description
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
  Write-Host "##vso[task.logissue type=error;]A critical error occurred in Analyze-And-Manage-Flaky-Tests.ps1: $($_.Exception.Message)"
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