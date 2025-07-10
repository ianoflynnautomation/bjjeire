<#
.SYNOPSIS
    Analyzes test history, creates/resolves Bug work items for flaky tests, and manages a quarantine tag.
.DESCRIPTION
    Uses the AdoWorkItemManagement module to query test history, identify flaky tests, and synchronize their state with Azure Boards.
.NOTES
    Version: 2.0
    Author: 
    Depends on: AdoWorkItemManagement.psm1, AzTable module
#>
[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]$StorageConnectionString,
  [Parameter(Mandatory = $true)]
  [string]$TableName,
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
  
  # --- Analysis Thresholds ---
  [int]$TimeWindowDays = 14,
  [double]$FlakinessThreshold = 0.01, # e.g., 1% flip rate
  [int]$MinRunsThreshold = 20, # A test must run at least this many times to be considered for analysis
  [int]$MinFlipsThreshold = 2, # A test must flip state at least this many times to be flagged by flip-rate
  [double]$DurationStdDevFactor = 2.5 # Flag if StdDev is > 2.5x the average duration
)

$httpClient = $null

try {
  # 1. Initialization
  $modulePath = Join-Path $PSScriptRoot "..\Modules\AdoWorkItemManagement\AdoWorkItemManagement.psm1"
  Write-Host "Importing module from: $modulePath"
  Import-Module -Name $modulePath -Force
  Import-Module -Name AzTable -ErrorAction Stop

  Write-Host "Initializing HttpClient..."
  Add-Type -AssemblyName System.Net.Http
  $httpClient = [System.Net.Http.HttpClient]::new()
  $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)

  # 2. Fetch and Analyze Data from Table Storage
  $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString
  $tableRef = Get-AzStorageTable -Name $TableName -Context $storageContext
    
  $startDate = (Get-Date).AddDays(-$TimeWindowDays).ToUniversalTime()
  $filter = "Timestamp ge datetime'$($startDate.ToString("o"))'"
    
  Write-Host "Fetching test results with filter: $filter"
  $recentTestResults = Get-AzTableRow -Table $tableRef.CloudTable -CustomFilter $filter

  if (-not $recentTestResults) {
    Write-Warning "No test results found in the last $TimeWindowDays days."
    exit 0
  }

  $uniqueTests = $recentTestResults | Group-Object -Property TestName
  $currentlyFlakyTests = [System.Collections.Generic.List[PSObject]]::new()

  Write-Host "Analyzing $($uniqueTests.Count) unique tests with the following thresholds:"
  Write-Host "- Min Runs: $MinRunsThreshold"
  Write-Host "- Min Flips: $MinFlipsThreshold"
  Write-Host "- Flip Rate: $($FlakinessThreshold.ToString('P0'))"
  Write-Host "- Duration StdDev Factor: $DurationStdDevFactor"

  foreach ($testGroup in $uniqueTests) {
    $testName = $testGroup.Name
    $history = $testGroup.Group | Sort-Object -Property Timestamp
    if ($history.Count -lt $MinRunsThreshold) { continue }
        
    $flakinessReasons = [System.Collections.Generic.List[string]]::new()

    # --- SIGNAL 1: Flip-Rate Analysis (with Statistical Significance) ---
    $flips = 0
    for ($i = 1; $i -lt $history.Count; $i++) {
      if (($history[$i].Outcome -eq 'Passed' -and $history[$i - 1].Outcome -eq 'Failed') -or
        ($history[$i].Outcome -eq 'Failed' -and $history[$i - 1].Outcome -eq 'Passed')) {
        $flips++
      }
    }
    $flipRate = $flips / ($history.Count - 1)

    if ($flipRate -ge $FlakinessThreshold -and $flips -ge $MinFlipsThreshold) {
      $flakinessReasons.Add("High flip rate (Rate: $($flipRate.ToString('P2')), Flips: $flips)")
    }

    # --- SIGNAL 2: Execution Duration Variance Analysis ---
    $durations = $history.DurationMs | ForEach-Object { [double]$_ }
    if ($durations.Count -gt 5) {
      # Only analyze if we have enough data points for duration
      $avgDuration = $durations | Measure-Object -Average | Select-Object -ExpandProperty Average
      if ($avgDuration -gt 50) {
        # Ignore variance for very fast tests (e.g., < 50ms)
        $sumOfSquares = ($durations | ForEach-Object { [math]::Pow($_ - $avgDuration, 2) }) | Measure-Object -Sum | Select-Object -ExpandProperty Sum
        $stdDev = [math]::Sqrt($sumOfSquares / $durations.Count)

        if ($stdDev -gt ($avgDuration * $DurationStdDevFactor)) {
          $flakinessReasons.Add("Unstable execution time (Avg: $($avgDuration.ToString('F0'))ms, StdDev: $($stdDev.ToString('F0'))ms)")
        }
      }
    }

    # --- Decision: If any signal was triggered, flag the test ---
    if ($flakinessReasons.Count -gt 0) {
      $lastFailure = $history | Where-Object { $_.Outcome -eq 'Failed' } | Sort-Object -Property Timestamp -Descending | Select-Object -First 1
      $currentlyFlakyTests.Add([PSCustomObject]@{
          TestName    = $testName
          Reasons     = $flakinessReasons
          TotalRuns   = $history.Count
          HistoryText = ($history.Outcome -join ', ')
          LastFailure = $lastFailure
        })
    }
  }
  Write-Host "Analysis complete. Found $($currentlyFlakyTests.Count) flaky tests."

  # 3. Synchronize with Azure Boards
  Write-Host "Fetching existing flaky test bugs from Azure Boards..."
  $existingBugs = Get-AdoWorkItemsByTag -HttpClient $httpClient -Organization $Organization -Project $Project -Tag "FlakyTest" -ApiVersion $ApiVersion
  Write-Host "Found $($existingBugs.Count) open flaky test bugs."

  foreach ($flakyTest in $currentlyFlakyTests) {
    $bugExists = $existingBugs | Where-Object { $_.fields.'System.Title' -like "*$($flakyTest.TestName)*" -and $_.fields.'System.State' -ne 'Resolved' -and $_.fields.'System.State' -ne 'Closed' }
        
    if (-not $bugExists) {
      Write-Host "##vso[task.logissue type=warning]CREATING new bug for flaky test: $($flakyTest.TestName)"
      $reasonsList = ($flakyTest.Reasons | ForEach-Object { "<li>$_</li>" }) -join ''
      $description = "<h3>Automated Flaky Test Report</h3>This test has been identified as flaky by the automated detection pipeline.<br/><br/><b>Action Required:</b> Please investigate the root cause.<hr><b>Reason(s) for Flakiness:</b><ul>$reasonsList</ul><b>Total Runs Analyzed:</b> $($flakyTest.TotalRuns)<br/><b>Recent History (oldest to newest):</b> $($flakyTest.HistoryText)<br/><br/><b>Last Failure Details:</b><ul><li><b>Build ID:</b> $($flakyTest.LastFailure.BuildId)</li><li><b>Error Message:</b> $($flakyTest.LastFailure.ErrorMessage)</li></ul>"
      New-AdoBugForFlakyTest -HttpClient $httpClient -Organization $Organization -Project $Project -TestName $flakyTest.TestName -Description $description -AreaPath $AreaPath -Tags "FlakyTest; Automated; Quarantined" -ApiVersion $ApiVersion
    }
  }

  foreach ($bug in $existingBugs) {
    $testNameInTitle = ($bug.fields.'System.Title' -replace '\[Flaky Test\] ', '')
    $isStillFlaky = $currentlyFlakyTests | Where-Object { $_.TestName -eq $testNameInTitle }
        
    if (-not $isStillFlaky -and ($bug.fields.'System.State' -in @('New', 'Active', 'To Do'))) {
      Write-Host "##vso[task.logissue type=warning]RESOLVING stale bug #$($bug.id) for test: $testNameInTitle"
      $createdDate = [datetime]$bug.fields.'System.CreatedDate'
      $mttr = (Get-Date) - $createdDate
      $comment = "Test is no longer flaky based on analysis over the last $TimeWindowDays days. Automatically resolved by pipeline. MTTR: $($mttr.Days) days, $($mttr.Hours) hours."
            
      $newTags = ($bug.fields.'System.Tags' -replace 'Quarantined;? ?', '')
      # NOTE: This should be 'Resolved' in enterprize environment for work item 'Bug'. We use work item 'Task' as its in free version
      # Update-AdoBugState -HttpClient $httpClient -Organization $Organization -BugId $bug.id -State "Resolved" -Comment $comment -Tags $newTags -ApiVersion $ApiVersion
      Update-AdoBugState -HttpClient $httpClient -Organization $Organization -BugId $bug.id -State "Done" -Comment $comment -Tags $newTags -ApiVersion $ApiVersion
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
  if ($null -ne $httpClient) {
    $httpClient.Dispose()
  }
}
