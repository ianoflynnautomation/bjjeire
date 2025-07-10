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
  [int]$TimeWindowDays = 14,
  [double]$FlakinessThreshold = 0.01,
  [int]$MinRunsThreshold = 10,
  [Parameter(Mandatory = $false)]
  [string]$ApiVersion = '7.1'
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

    Write-Host "Analyzing $($uniqueTests.Count) unique tests..."
    foreach ($testGroup in $uniqueTests) {
        $testName = $testGroup.Name
        $history = $testGroup.Group | Sort-Object -Property Timestamp
        if ($history.Count -lt $MinRunsThreshold) { continue }
        
        $flips = 0
        for ($i = 1; $i -lt $history.Count; $i++) {
            if (($history[$i].Outcome -eq 'Passed' -and $history[$i - 1].Outcome -eq 'Failed') -or
                ($history[$i].Outcome -eq 'Failed' -and $history[$i - 1].Outcome -eq 'Passed')) {
                $flips++
            }
        }
        $flipRate = $flips / ($history.Count - 1)

        if ($flipRate -ge $FlakinessThreshold) {
            $lastFailure = $history | Where-Object { $_.Outcome -eq 'Failed' } | Sort-Object -Property Timestamp -Descending | Select-Object -First 1
            $currentlyFlakyTests.Add([PSCustomObject]@{
                TestName    = $testName
                FlipRate    = $flipRate
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
            $description = "<h3>Automated Flaky Test Report</h3>This test has been identified as flaky by the automated detection pipeline.<br/><br/><b>Action Required:</b> Please investigate the root cause.<hr><b>Flakiness Score:</b> $(($flakyTest.FlipRate).ToString("P2"))<br/><b>Total Runs Analyzed:</b> $($flakyTest.TotalRuns)<br/><b>Recent History (oldest to newest):</b> $($flakyTest.HistoryText)<br/><br/><b>Last Failure Details:</b><ul><li><b>Build ID:</b> $($flakyTest.LastFailure.BuildId)</li><li><b>Error Message:</b> $($flakyTest.LastFailure.ErrorMessage)</li></ul>"
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
            Update-AdoBugState -HttpClient $httpClient -Organization $Organization -BugId $bug.id -State "Resolved" -Comment $comment -Tags $newTags -ApiVersion $ApiVersion
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
