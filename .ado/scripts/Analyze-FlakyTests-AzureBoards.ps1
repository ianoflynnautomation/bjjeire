<#
.SYNOPSIS
    Analyzes test history and creates/resolves Bug work items in Azure Boards for flaky tests.
.DESCRIPTION
    Queries recent test history from Azure Table Storage, identifies flaky tests, and then synchronizes their state with Azure Boards.
    - If a test is flaky and has no active Bug, it creates one.
    - If a test is no longer flaky but has an open Bug, it resolves it.
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
  [double]$FlakinessThreshold = 0.10,
  [int]$MinRunsThreshold = 5,
  [Parameter(Mandatory = $false)]
  [string]$ApiVersion = '7.1'
)

# Set up authentication headers for Azure DevOps API
$adoHeaders = @{ Authorization = "Bearer $Pat"; "Content-Type" = "application/json-patch+json" }

function Get-AdoWorkItemsByTag {
  param($tag)
  $encodedProject = [uri]::EscapeDataString($Project)
  $wiql = @{
    query = "SELECT [System.Id] FROM workitems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS '$tag' AND [System.State] <> 'Closed' AND [System.State] <> 'Resolved' AND [System.State] <> 'Done'"
  } | ConvertTo-Json
  $url = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/wiql?api-version=$ApiVersion"
  $response = Invoke-RestMethod -Method Post -Uri $url -Headers $adoHeaders -Body $wiql
  if ($response.workItems) {
    $ids = ($response.workItems.id | ForEach-Object { $_ }) -join ','
    if ([string]::IsNullOrEmpty($ids)) { return @() }
    $getDetailsUrl = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/workitems?ids=$ids&`$expand=fields&api-version=$ApiVersion"
    return (Invoke-RestMethod -Method Get -Uri $getDetailsUrl -Headers $adoHeaders).value
  }
  return @()
}

function New-AdoBug {
  param($testName, $description)
  $encodedProject = [uri]::EscapeDataString($Project)
  $url = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/workitems/`$Bug?api-version=$ApiVersion"
  $body = @(
    @{ op = "add"; path = "/fields/System.Title"; value = "Flaky Test Detected: $testName" },
    @{ op = "add"; path = "/fields/System.Description"; value = $description },
    @{ op = "add"; path = "/fields/System.AreaPath"; value = $AreaPath },
    @{ op = "add"; path = "/fields/System.Tags"; value = "FlakyTest;Automated" }
  ) | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri $url -Headers $adoHeaders -Body $body
}

function Resolve-AdoBug {
  param($bugId)
  $url = "https://dev.azure.com/$Organization/_apis/wit/workitems/$bugId?api-version=$ApiVersion"
  $body = @(
    @{ op = "add"; path = "/fields/System.State"; value = "Resolved" },
    @{ op = "add"; path = "/fields/System.History"; value = "Test is no longer flaky. Automatically resolved by pipeline." }
  ) | ConvertTo-Json
  Invoke-RestMethod -Method Patch -Uri $url -Headers $adoHeaders -Body $body
}

try {
  # --- 1. Flakiness Analysis ---
  # Import all required modules
  Import-Module -Name Az.Storage -ErrorAction Stop
  Import-Module -Name Az.Resources -ErrorAction Stop
  Import-Module -Name AzTable -ErrorAction Stop

  $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString
  $tableRef = Get-AzStorageTable -Name $TableName -Context $storageContext
  $cloudTable = $tableRef.CloudTable

  # Correctly format the date filter for AzTable using the 'o' round-trip format specifier
  $startDate = (Get-Date).AddDays(-$TimeWindowDays).ToUniversalTime()
  $filter = "Timestamp ge datetime'$($startDate.ToString("o"))'"
    
  Write-Host "Fetching test results with filter: $filter"
  # FIX: Explicitly qualify the cmdlet with the module name 'AzTable' to prevent command conflicts.
  $recentTestResults = AzTable\Get-AzTableRow -Table $cloudTable -Filter $filter

  if (-not $recentTestResults) {
    Write-Warning "No test results found in the last $TimeWindowDays days."
    exit 0
  }

  $uniqueTests = $recentTestResults | Group-Object -Property TestName
  $currentlyFlakyTests = [System.Collections.Generic.List[PSObject]]::new()

  foreach ($testGroup in $uniqueTests) {
    $testName = $testGroup.Name
    $history = $testGroup.Group | Sort-Object -Property Timestamp
    if ($history.Count -lt $MinRunsThreshold) { continue }
    $flips = 0
    for ($i = 1; $i -lt $history.Count; $i++) {
      if ($history[$i].Outcome -ne $history[$i - 1].Outcome) { $flips++ }
    }
    $flipRate = $flips / ($history.Count - 1)
    if ($flipRate -ge $FlakinessThreshold) {
      $currentlyFlakyTests.Add([PSCustomObject]@{
          TestName    = $testName
          HistoryText = ($history.Outcome -join ' -> ')
        })
    }
  }
  Write-Host "Analysis complete. Found $($currentlyFlakyTests.Count) flaky tests."

  # --- 2. Synchronize with Azure Boards ---
  Write-Host "Fetching existing flaky test bugs from Azure Boards..."
  $existingBugs = Get-AdoWorkItemsByTag -tag "FlakyTest"
  Write-Host "Found $($existingBugs.Count) open flaky test bugs."

  # Create new bugs for tests that are flaky but don't have an open bug
  foreach ($flakyTest in $currentlyFlakyTests) {
    $bugExists = $false
    foreach ($bug in $existingBugs) {
      if ($bug.fields.'System.Title' -like "*$($flakyTest.TestName)*") {
        $bugExists = $true
        break
      }
    }
    if (-not $bugExists) {
      Write-Host "CREATING new bug for flaky test: $($flakyTest.TestName)"
      $description = "This test has been identified as flaky.<br><b>Recent History:</b> $($flakyTest.HistoryText)"
      New-AdoBug -testName $flakyTest.TestName -description $description
    }
  }

  # Resolve old bugs for tests that are no longer flaky
  foreach ($bug in $existingBugs) {
    $testNameInTitle = ($bug.fields.'System.Title' -split ': ')[1]
    $isStillFlaky = $false
    foreach ($flakyTest in $currentlyFlakyTests) {
      if ($flakyTest.TestName -eq $testNameInTitle) {
        $isStillFlaky = $true
        break
      }
    }
    if (-not $isStillFlaky) {
      Write-Host "RESOLVING stale bug #$($bug.id) for test: $testNameInTitle"
      Resolve-AdoBug -bugId $bug.id
    }
  }
  Write-Host "Azure Boards synchronization complete."
}
catch {
  Write-Error "An error occurred: $_"
  $_.Exception.StackTrace
  exit 1
}
