<#
.SYNOPSIS
    Analyzes test history from Kusto to create or resolve work items for flaky tests. (Version 5.3)
.DESCRIPTION
    This script connects to Azure Data Explorer to identify flaky tests based on an enhanced query
    that detects outcome flips and new instability. It synchronizes these findings with Azure Boards
    by creating new bugs (suggesting an owner) and automatically resolving bugs for tests that are
    now stable.
.NOTES
    Version: 5.3
    Author: Staff SDET
    Changes:
    - Temporarily commented out all logic related to custom fields ('FirstFailureDate', 'MTTRDays')
      to allow the script to run on Azure DevOps environments where custom fields cannot be created.
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
  [Parameter(Mandatory = $false)][int]$StabilityLookbackDays = 30,
  [Parameter(Mandatory = $false)][double]$FlakinessThreshold = 0.02,
  [Parameter(Mandatory = $false)][int]$MinRunsThreshold = 20,
  [Parameter(Mandatory = $false)][int]$MinFlipsThreshold = 3
  # [Parameter(Mandatory = $false)][string]$FirstFailureDateField = 'Custom.FirstFailureDate',
  # [Parameter(Mandatory = $false)][string]$MttrField = 'Custom.MTTRDays'
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

  # 2. Define and Execute ENHANCED KQL Query to Find Flaky Tests
  Write-Host "Executing enhanced KQL query to find flaky tests..."
  
  $kqlFlakinessThreshold = $FlakinessThreshold.ToString([System.Globalization.CultureInfo]::InvariantCulture)

  $kqlQuery = @"
let lookbackPeriod = $($TimeWindowDays)d;
let stabilityPeriod = $($StabilityLookbackDays)d;
let minRunsThreshold = $MinRunsThreshold;
let flakinessThreshold = $kqlFlakinessThreshold;
let minFlipsThreshold = $MinFlipsThreshold;
let StabilityInfo = TestResultHistory
    | where Timestamp between (ago(stabilityPeriod) .. ago(lookbackPeriod))
    | summarize WasStable = (countif(Outcome != 'Passed') == 0) by TestName;
let FlakinessAnalysis = TestResultHistory
    | where Timestamp > ago(lookbackPeriod)
    | partition hint.strategy=native by TestName (
        order by Timestamp asc
        | extend PrevOutcome = prev(Outcome)
        | extend IsFlip = Outcome != PrevOutcome
        | summarize
            TotalRuns = count(),
            PassedRuns = countif(Outcome == 'Passed'),
            FailedRuns = countif(Outcome == 'Failed'),
            Flips = countif(IsFlip),
            Durations = make_list(DurationMs),
            History = make_list(bag_pack('Timestamp', Timestamp, 'Outcome', Outcome)),
            FirstFailure = arg_min(iif(Outcome == 'Failed', Timestamp, datetime(null)), *),
            LastFailure = arg_max(iif(Outcome == 'Failed', Timestamp, datetime(null)), *)
            by TestName
    );
FlakinessAnalysis
| join kind=leftouter StabilityInfo on TestName
| where TotalRuns > minRunsThreshold and FailedRuns > 0
| extend FlipRate = todouble(FailedRuns) / TotalRuns
| where (FlipRate >= flakinessThreshold and Flips >= minFlipsThreshold) or (WasStable == true)
| extend Reasons = pack_array(
    iif(FlipRate >= flakinessThreshold and Flips >= minFlipsThreshold, strcat('High flip rate (', tostring(toint(FlipRate*100)), '%) with ', Flips, ' outcome flips.'), dynamic(null)),
    iif(WasStable == true, 'Newly unstable: This test was stable for the preceding period.', dynamic(null))
  )
| project TestName, Reasons, FirstFailure, LastFailure, History
"@

  # --- DEBUGGING: Print the generated KQL query to the console ---
  Write-Host "====================== KQL QUERY TO BE EXECUTED ======================"
  Write-Host $kqlQuery
  Write-Host "===================================================================="

  $queryPayload = @{ db = $KustoDatabaseName; csl = $kqlQuery } | ConvertTo-Json
  $queryUrl = "$KustoClusterUri/v2/rest/query"
  $kustoResult = Invoke-ResilientRestMethod -HttpClient $adxHttpClient -Uri $queryUrl -Method 'POST' -Body $queryPayload

  # 3. Parse Kusto Results
  $currentlyFlakyTests = [System.Collections.Generic.List[PSObject]]::new()
  if ($kustoResult.Tables[0].Rows) {
    $currentlyFlakyTests = $kustoResult.Tables[0].Rows | ForEach-Object {
      [PSCustomObject]@{
        TestName        = $_[0]
        Reasons         = $_[1] | ConvertFrom-Json
        FirstFailure    = $_[2] | ConvertFrom-Json
        LastFailure     = $_[3] | ConvertFrom-Json
        HistoryText     = ($_[-1] | ConvertFrom-Json | Sort-Object Timestamp).Outcome -join ', '
        AssignedToEmail = ($_[2] | ConvertFrom-Json).RequestedForEmail
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
    # Fields       = "System.Id,System.Title,System.State,System.Tags,System.CreatedDate,$($FirstFailureDateField)"
  }
  $existingBugs = Get-AdoWorkItemsByTag @getBugsParams

  # --- Create new bugs ---
  foreach ($flakyTest in $currentlyFlakyTests) {
    $bugExists = $existingBugs | Where-Object { $_.fields.'System.Title' -like "*$($flakyTest.TestName)*" -and $_.fields.'System.State' -notin ('Resolved', 'Closed', 'Done') }
    if (-not $bugExists) {
      Write-Host "##vso[task.logissue type=warning]CREATING new bug for flaky test: $($flakyTest.TestName)"
            
      $bugDescription = Get-FlakyTestBugDescription -FlakyTest $flakyTest -Organization $Organization -Project $Project -RepoName $RepoName -DashboardUrl $TestHealthDashboardUrl
      
      # $customFields = @{
      #   ($FirstFailureDateField) = $flakyTest.FirstFailure.Timestamp
      # }

      $newBugParams = @{
        HttpClient      = $adoHttpClient
        Organization    = $Organization
        Project         = $Project
        TestName        = $flakyTest.TestName
        Description     = $bugDescription
        AreaPath        = $AreaPath
        Tags            = "FlakyTest; Automated; Quarantined"
        AssignedToEmail = $flakyTest.AssignedToEmail
        # CustomFields    = $customFields
        ApiVersion      = $AdoApiVersion
      }
      New-AdoBugForFlakyTest @newBugParams
    }
  }

  # --- Resolve stale bugs ---
  foreach ($bug in $existingBugs) {
    $testNameInTitle = $bug.fields.'System.Title' -replace '^\[Flaky Test\] '
    $isStillFlaky = $currentlyFlakyTests | Where-Object { $_.TestName -eq $testNameInTitle }
    if (-not $isStillFlaky -and $bug.fields.'System.State' -in @('New', 'Active', 'To Do', 'Proposed')) {
      Write-Host "##vso[task.logissue type=warning]RESOLVING stale bug #$($bug.id) for test: $testNameInTitle"
      
      # MTTR Calculation now only uses the bug creation date as a fallback.
      $mttr = (Get-Date) - ([datetime]$bug.fields.'System.CreatedDate')
      $mttrDays = [Math]::Round($mttr.TotalDays, 2)

      $comment = "Test is no longer flaky based on analysis over the last $TimeWindowDays days. Automatically resolved by pipeline. MTTR (based on bug lifetime): $mttrDays days."
      
      # $updateCustomFields = @{
      #   ($MttrField) = $mttrDays
      # }

      $resolveBugParams = @{
        HttpClient   = $adoHttpClient
        Organization = $Organization
        WorkItemId   = $bug.id
        State        = "Done"
        Comment      = $comment
        Tags         = ($bug.fields.'System.Tags' -replace 'Quarantined;? ?', '')
        # CustomFields = $updateCustomFields
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
  if ($null -ne $adoHttpClient) { $adoHttpClient.Dispose() }
  if ($null -ne $adxHttpClient) { $adxHttpClient.Dispose() }
  $startTime.Stop()
  Write-Host "Script completed in $($startTime.Elapsed.TotalSeconds) seconds."
}
