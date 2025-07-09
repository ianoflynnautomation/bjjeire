<#
.SYNOPSIS
    Analyzes test history, creates/resolves Bug work items for flaky tests, and manages a quarantine tag.
.DESCRIPTION
    Queries recent test history from Azure Table Storage, identifies flaky tests based on a flip-rate algorithm,
    and synchronizes their state with Azure Boards.
    - If a test is flaky and has no active Bug, it creates a detailed one and adds a 'Quarantined' tag.
    - If a test is no longer flaky but has an open Bug, it resolves the bug and removes the 'Quarantined' tag.
.NOTES
    Version: 1.0
    Author: 
.PARAMETER StorageConnectionString
    The connection string for the Azure Storage Account.
.PARAMETER TableName
    The name of the table containing test history.
.PARAMETER Organization
    Your Azure DevOps organization name.
.PARAMETER Project
    Your Azure DevOps project name.
.PARAMETER Pat
    A Personal Access Token (PAT) with "Work Items - Read & Write" permissions. Use $(System.AccessToken).
.PARAMETER AreaPath
    The Area Path to assign new Bugs to (e.g., "MyProject\TestHealth").
.PARAMETER TimeWindowDays
    The number of days back to analyze for flakiness. Defaults to 14.
.PARAMETER FlakinessThreshold
    The minimum "flip rate" for a test to be considered flaky. Defaults to 0.10.
.PARAMETER MinRunsThreshold
    The minimum number of runs a test must have to be analyzed. Defaults to 5.
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

$adoQueryHeaders = @{ Authorization = "Bearer $Pat"; "Content-Type" = "application/json" }
$adoPatchHeaders = @{ Authorization = "Bearer $Pat"; "Content-Type" = "application/json-patch+json" }

function Get-AdoWorkItemsByTag {
  param($tag)
  $encodedProject = [uri]::EscapeDataString($Project)
  $wiql = @{
    query = "SELECT [System.Id], [System.Title], [System.State], [System.Tags] FROM workitems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS '$tag' AND [System.State] <> 'Removed'"
  } | ConvertTo-Json
  $url = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/wiql?api-version=$ApiVersion"
  $response = Invoke-RestMethod -Method Post -Uri $url -Headers $adoQueryHeaders -Body $wiql
  if ($response.workItems) {
    $ids = ($response.workItems.id | ForEach-Object { $_ }) -join ','
    if ([string]::IsNullOrEmpty($ids)) { return @() }
    $getDetailsUrl = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/workitems?ids=$ids&`$expand=fields&api-version=$ApiVersion"
    return (Invoke-RestMethod -Method Get -Uri $getDetailsUrl -Headers $adoQueryHeaders).value
  }
  return @()
}

function New-AdoBugForFlakyTest {
  param($testName, $description, $tags)
  $encodedProject = [uri]::EscapeDataString($Project)
  # # TODO: work item BUG is not available in free account
  # $url = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/workitems/`$Bug?api-version=$ApiVersion"
  $url = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/workitems/`$Task?api-version=$ApiVersion"
  $body = @(
    @{ op = "add"; path = "/fields/System.Title"; value = "[Flaky Test] $testName" },
    # TODO: Use Microsoft.VSTS.TCM.ReproSteps when work item is BUG
    #@{ op = "add"; path = "/fields/Microsoft.VSTS.TCM.ReproSteps"; value = $description },
    @{ op = "add"; path = "/fields/System.Description"; value = $description },
    @{ op = "add"; path = "/fields/System.AreaPath"; value = $AreaPath },
    @{ op = "add"; path = "/fields/System.Tags"; value = $tags },
    @{ op = "add"; path = "/fields/Microsoft.VSTS.Common.Priority"; value = 2 }
  ) | ConvertTo-Json
  return Invoke-RestMethod -Method Post -Uri $url -Headers $adoPatchHeaders -Body $body
}

function Update-AdoBugState {
  param($bugId, $state, $comment, $tags)
  $url = "https://dev.azure.com/$Organization/_apis/wit/workitems/$bugId?api-version=$ApiVersion"
  $bodyPayload = [System.Collections.Generic.List[object]]::new()
  $bodyPayload.Add(@{ op = "add"; path = "/fields/System.State"; value = $state })
  $bodyPayload.Add(@{ op = "add"; path = "/fields/System.History"; value = $comment })
  if ($tags) {
    $bodyPayload.Add(@{ op = "add"; path = "/fields/System.Tags"; value = $tags })
  }
  Invoke-RestMethod -Method Patch -Uri $url -Headers $adoPatchHeaders -Body ($bodyPayload | ConvertTo-Json)
}

try {
  if (-not (Get-Module -Name AzTable -ListAvailable)) {
    Write-Host "AzTable module not found. Installing..."
    Install-Module -Name AzTable -Repository PSGallery -Force -AcceptLicense -Scope CurrentUser
  }
  Import-Module -Name AzTable

  $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString
  $tableRef = Get-AzStorageTable -Name $TableName -Context $storageContext
  $cloudTable = $tableRef.CloudTable

  $startDate = (Get-Date).AddDays(-$TimeWindowDays).ToUniversalTime()
  $filter = "Timestamp ge datetime'$($startDate.ToString("o"))'"
    
  Write-Host "Fetching test results with filter: $filter"
  $recentTestResults = Get-AzTableRow -Table $cloudTable -CustomFilter $filter

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

  # --- 2. Synchronize with Azure Boards ---
  Write-Host "Fetching existing flaky test bugs from Azure Boards..."
  $existingBugs = Get-AdoWorkItemsByTag -tag "FlakyTest"
  Write-Host "Found $($existingBugs.Count) open flaky test bugs."

  foreach ($flakyTest in $currentlyFlakyTests) {
    $bugExists = $existingBugs | Where-Object { $_.fields.'System.Title' -like "*$($flakyTest.TestName)*" }
        
    if (-not $bugExists) {
      Write-Host "CREATING new bug for flaky test: $($flakyTest.TestName)"
      $testCaseUrl = "https://dev.azure.com/$Organization/$Project/_testPlans/execute?testCaseId=$($flakyTest.LastFailure.TestCaseId)&runId=0"
      $description = @"
            <h3>Automated Flaky Test Report</h3>
            This test has been identified as flaky by the automated detection pipeline.
            <br/><br/>
            <b>Action Required:</b> Please investigate the root cause. If this test is blocking builds, it will be automatically quarantined.
            <hr>
            <b>Flakiness Score:</b> $(($flakyTest.FlipRate).ToString("P2"))
            <b>Total Runs Analyzed:</b> $($flakyTest.TotalRuns)
            <b>Recent History (oldest to newest):</b> $($flakyTest.HistoryText)
            <br/><br/>
            <b>Last Failure Details:</b>
            <ul>
                <li><b>Build ID:</b> <a href='https://dev.azure.com/$Organization/$Project/_build/results?buildId=$($flakyTest.LastFailure.BuildId)'>$($flakyTest.LastFailure.BuildId)</a></li>
                <li><b>Error Message:</b> $($flakyTest.LastFailure.ErrorMessage)</li>
            </ul>
            <br/>
            <a href='$testCaseUrl'>View Test Case in Azure Test Plans</a>
"@
      New-AdoBugForFlakyTest -testName $flakyTest.TestName -description $description -tags "FlakyTest; Automated; Quarantined"
    }
  }

  foreach ($bug in $existingBugs) {
    $testNameInTitle = ($bug.fields.'System.Title' -replace '\[Flaky Test\] ', '')
    $isStillFlaky = $currentlyFlakyTests | Where-Object { $_.TestName -eq $testNameInTitle }
        
    if (-not $isStillFlaky -and ($bug.fields.'System.State' -in @('New', 'Active', 'To Do'))) {
      Write-Host "RESOLVING stale bug #$($bug.id) for test: $testNameInTitle"
      $createdDate = [datetime]$bug.fields.'System.CreatedDate'
      $mttr = (Get-Date) - $createdDate
      $comment = "Test is no longer flaky based on analysis over the last $TimeWindowDays days. Automatically resolved by pipeline. MTTR: $($mttr.Days) days, $($mttr.Hours) hours."
            
      $newTags = ($bug.fields.'System.Tags' -replace 'Quarantined;? ?', '')
      Update-AdoBugState -bugId $bug.id -state "Resolved" -comment $comment -tags $newTags
    }
  }
  Write-Host "Azure Boards synchronization complete."
}
catch {
  Write-Error "An error occurred: $_"
  $_.Exception.StackTrace
  exit 1
}
