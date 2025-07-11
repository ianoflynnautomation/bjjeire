<#
.SYNOPSIS
    Analyzes test history from Azure Data Explorer (Kusto), creates/resolves Bug work items for flaky tests, and manages a quarantine tag.
.DESCRIPTION
    This script connects to an Azure Data Explorer database, runs a KQL query to identify flaky tests, and synchronizes the findings with Azure Boards.
    This version replaces all local analysis logic with a server-side KQL query.
.NOTES
    Version: 3.1
    Author: Staff SDET
    Changes in v3.1:
    - Integrated the full bug creation and auto-resolution logic into the script.
#>
[CmdletBinding()]
param (
  # --- Azure DevOps & Context Parameters ---
  [Parameter(Mandatory = $true)]
  [string]$Organization,
  [Parameter(Mandatory = $true)]
  [string]$Project,
  [Parameter(Mandatory = $true)]
  [string]$Pat,
  [Parameter(Mandatory = $true)]
  [string]$AreaPath,
  [Parameter(Mandatory = $false)]
  [string]$ApiVersion = '7.1',
  [string]$RepoName,
  [string]$TestHealthDashboardUrl,
  [ValidateSet('Codeowners', 'BuildTriggerUser')]
  [string]$AssignmentMethod = 'BuildTriggerUser',

  # --- NEW: Azure Data Explorer (Kusto) Parameters ---
  [Parameter(Mandatory = $true)]
  [string]$KustoClusterUri, # e.g., "https://yourcluster.kusto.windows.net"
  [Parameter(Mandatory = $true)]
  [string]$DatabaseName,
  [Parameter(Mandatory = $true)]
  [string]$AppClientId,
  [Parameter(Mandatory = $true)]
  [string]$AppClientSecret,
  [Parameter(Mandatory = $true)]
  [string]$TenantId,

  # --- Analysis Thresholds (used in the KQL query) ---
  [int]$TimeWindowDays = 14,
  [double]$FlakinessThreshold = 0.01,
  [int]$MinRunsThreshold = 20,
  [int]$MinFlipsThreshold = 2,
  [double]$DurationStdDevFactor = 2.5
)

$adoHttpClient = $null
$adxHttpClient = $null

try {
  # 1. Initialization
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoWorkItemManagement\AdoWorkItemManagement.psm1") -Force

  Write-Host "Initializing HttpClient for Azure DevOps..."
  Add-Type -AssemblyName System.Net.Http
  $adoHttpClient = [System.Net.Http.HttpClient]::new()
  $adoHttpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)

  # 2. Authenticate to Azure Data Explorer
  Write-Host "Authenticating to Azure Data Explorer cluster: $KustoClusterUri"
  $authUrl = "https://login.microsoftonline.com/$TenantId/oauth2/token"
  $authBody = "grant_type=client_credentials&client_id=$AppClientId&client_secret=$AppClientSecret&resource=$KustoClusterUri"
  $tokenResponse = Invoke-RestMethod -Uri $authUrl -Method Post -Body $authBody -ContentType 'application/x-www-form-urlencoded'
  
  $adxHttpClient = [System.Net.Http.HttpClient]::new()
  $adxHttpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $tokenResponse.access_token)

  # 3. Define and Execute KQL Query to Find Flaky Tests
  Write-Host "Executing KQL query to find flaky tests..."
  $kqlQuery = @"
TestResultHistory
| where Timestamp > ago($($TimeWindowDays)d)
| summarize TotalRuns = count(),
            PassedRuns = countif(Outcome == "Passed"),
            FailedRuns = countif(Outcome == "Failed"),
            Durations = make_list(DurationMs),
            History = make_list(pack('Timestamp', Timestamp, 'Outcome', Outcome)),
            FirstFailure = arg_min(Timestamp, iif(Outcome=='Failed', pack_all(), null)),
            LastFailure = arg_max(Timestamp, iif(Outcome=='Failed', pack_all(), null)),
            LastGoodRun = arg_max(Timestamp, iif(Outcome=='Passed', pack_all(), null))
            by TestName
| where TotalRuns > $MinRunsThreshold and FailedRuns > 0
| extend FlipRate = todouble(FailedRuns) / TotalRuns
| extend DurationStats = series_stats_dynamic(Durations)
| extend DurationAvg = todouble(DurationStats.avg), DurationStdDev = todouble(DurationStats.stdev)
| extend Flips = FailedRuns // This is a simplification; for Kusto, FailedRuns is a good proxy for flips
| where (FlipRate >= $FlakinessThreshold and Flips >= $MinFlipsThreshold) 
    or (isnotnull(DurationAvg) and DurationAvg > 50 and DurationStdDev > (DurationAvg * $DurationStdDevFactor))
| extend Reasons = pack_array(
    iif(FlipRate >= $FlakinessThreshold and Flips >= $MinFlipsThreshold, strcat('High flip rate (', format_number(FlipRate, 'P2'), ')'), null),
    iif(isnotnull(DurationAvg) and DurationAvg > 50 and DurationStdDev > (DurationAvg * $DurationStdDevFactor), strcat('Unstable execution time (Avg: ', toint(DurationAvg), 'ms, StdDev: ', toint(DurationStdDev), 'ms)'), null)
  )
| project TestName, Reasons, FirstFailure, LastFailure, LastGoodRun, History
| extend Reasons = array_filter(Reasons, (r) => isnotnull(r))
"@

  $queryPayload = @{ db = $DatabaseName; csl = $kqlQuery } | ConvertTo-Json
  $queryUrl = "$KustoClusterUri/v2/rest/query"
  
  # Assumes Invoke-AdoRestMethodAsyncWithRetry is in the AdoWorkItemManagement module
  $queryResponse = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $adxHttpClient -Uri $queryUrl -Method 'POST' -Body $queryPayload
  $resultContent = $queryResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  $kustoTable = ($resultContent | ConvertFrom-Json).Tables[0]

  if (-not $kustoTable.Rows) {
    Write-Host "KQL query returned no flaky tests. All clear!"
    exit 0
  }

  # 4. Parse Kusto Results into a usable format
  $currentlyFlakyTests = $kustoTable.Rows | ForEach-Object {
    $historyList = ($_[-1] | ConvertFrom-Json | Sort-Object Timestamp).Outcome -join ', '
    [PSCustomObject]@{
      TestName     = $_[0]
      Reasons      = $_[1]
      FirstFailure = $_[2] | ConvertFrom-Json
      LastFailure  = $_[3] | ConvertFrom-Json
      LastGoodRun  = $_[4] | ConvertFrom-Json
      HistoryText  = $historyList
    }
  }
  Write-Host "Analysis complete. Found $($currentlyFlakyTests.Count) flaky tests via Kusto."

  # 5. Synchronize with Azure Boards
  Write-Host "Fetching existing flaky test bugs from Azure Boards..."
  $existingBugs = Get-AdoWorkItemsByTag -HttpClient $adoHttpClient -Organization $Organization -Project $Project -Tag "FlakyTest" -ApiVersion $ApiVersion
  
  # --- Create new bugs for newly detected flaky tests ---
  foreach ($flakyTest in $currentlyFlakyTests) {
    $bugExists = $existingBugs | Where-Object { $_.fields.'System.Title' -like "*$($flakyTest.TestName)*" -and $_.fields.'System.State' -ne 'Resolved' -and $_.fields.'System.State' -ne 'Closed' -and $_.fields.'System.State' -ne 'Done' }
        
    if (-not $bugExists) {
      Write-Host "##vso[task.logissue type=warning]CREATING new bug for flaky test: $($flakyTest.TestName)"
      
      # Determine Assignee
      $assignee = $flakyTest.FirstFailure.RequestedForEmail # Default

      # Build Rich Description
      $reasonsList = ($flakyTest.Reasons | ForEach-Object { "<li>$_</li>" }) -join ''
      $commitLink = "https://dev.azure.com/$Organization/$Project/_git/$RepoName/commit/$($flakyTest.FirstFailure.CommitId)"
      $firstFailureLink = "https://dev.azure.com/$Organization/$Project/_build/results?buildId=$($flakyTest.FirstFailure.BuildId)"
      $lastGoodRunLink = if ($flakyTest.LastGoodRun) { "https://dev.azure.com/$Organization/$Project/_build/results?buildId=$($flakyTest.LastGoodRun.BuildId)" } else { '' }
      $safeErrorMessage = $flakyTest.LastFailure.ErrorMessage -replace '<', '&lt;' -replace '>', '&gt;'

      $description = @"
<h3>Automated Flaky Test Report</h3>
<p>This test is now <strong>quarantined</strong>. Please investigate and fix the underlying instability.</p>
<hr>
<p><strong>Detection Reason(s):</strong></p>
<ul>$reasonsList</ul>
<p><strong>Suggested Culprit Commit:</strong> <a href="$commitLink">$($flakyTest.FirstFailure.CommitId.Substring(0,8))</a></p>
<hr>
<p><strong>Context Links:</strong></p>
<ul>
    <li><a href="$firstFailureLink">First Failing Build</a></li>
"@
      if ($lastGoodRunLink) {
        $description += "<li><a href=`"$lastGoodRunLink`">Last Known-Good Build</a></li>"
      }
      $description += @"
    <li><a href="$TestHealthDashboardUrl">Test Health Dashboard</a></li>
</ul>
<hr>
<p><strong>Recent History (oldest to newest):</strong></p>
<p>$($flakyTest.HistoryText)</p>
<p><strong>Last Failure Error:</strong></p>
<pre>$safeErrorMessage</pre>
"@
      
      New-AdoBugForFlakyTest -HttpClient $adoHttpClient -Organization $Organization -Project $Project -TestName $flakyTest.TestName -Description $description -AreaPath $AreaPath -Tags "FlakyTest; Automated; Quarantined" -AssignedToEmail $assignee -ApiVersion $ApiVersion
    }
  }

  # --- Resolve bugs for tests that are no longer flaky ---
  foreach ($bug in $existingBugs) {
    $testNameInTitle = ($bug.fields.'System.Title' -replace '\[Flaky Test\] ', '')
    $isStillFlaky = $currentlyFlakyTests | Where-Object { $_.TestName -eq $testNameInTitle }
        
    if (-not $isStillFlaky -and ($bug.fields.'System.State' -in @('New', 'Active', 'To Do'))) {
      Write-Host "##vso[task.logissue type=warning]RESOLVING stale bug #$($bug.id) for test: $testNameInTitle"
      $createdDate = [datetime]$bug.fields.'System.CreatedDate'
      $mttr = (Get-Date) - $createdDate
      $comment = "Test is no longer flaky based on Kusto analysis over the last $TimeWindowDays days. Automatically resolved by pipeline. MTTR: $($mttr.Days) days, $($mttr.Hours) hours."
            
      $newTags = ($bug.fields.'System.Tags' -replace 'Quarantined;? ?', '')
      Update-AdoBugState -HttpClient $adoHttpClient -Organization $Organization -BugId $bug.id -State "Done" -Comment $comment -Tags $newTags -ApiVersion $ApiVersion
    }
  }

  Write-Host "Azure Boards synchronization complete."
}
catch {
  Write-Host "##vso[task.logissue type=error]An error occurred: $_"
  Write-Host "##vso[task.logissue type=error]$($_.ScriptStackTrace)"
  exit 1
}
finally {
  if ($null -ne $adoHttpClient) { $adoHttpClient.Dispose() }
  if ($null -ne $adxHttpClient) { $adxHttpClient.Dispose() }
}
