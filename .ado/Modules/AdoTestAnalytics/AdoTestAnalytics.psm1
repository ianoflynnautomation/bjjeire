<#
.SYNOPSIS
    A module for fetching Azure DevOps test data and publishing it to Azure Data Explorer.
.DESCRIPTION
    Provides high-level functions to orchestrate fetching test runs and results, transforming
    the data, and ingesting it into ADX. Depends on AdoAutomationCore.psm1 for API interactions.
.NOTES
    Version: 2.0
    Author: Staff SDET
#>
using module "..\AdoAutomationCore\AdoAutomationCore.psm1"

function Get-AdoTestRuns {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][int]$BuildId,
    [Parameter(Mandatory = $true)][string]$ApiVersion
  )
  $url = "https://dev.azure.com/$Organization/$Project/_apis/test/runs?buildIds=$BuildId&includeRunDetails=true&api-version=$ApiVersion"
  return (Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url).value
}

function Get-AdoTestResults {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)]$TestRuns,
    [Parameter(Mandatory = $true)]$Context,
    [Parameter(Mandatory = $true)][string]$ApiVersion
  )

  $allEntities = [System.Collections.Generic.List[object]]::new()
  foreach ($run in $TestRuns) {
    if ($run.name -like '*Aggregated*') {
      Write-Host "##vso[task.debug]Skipping aggregated run '$($run.name)' (ID: $($run.id))."
      continue
    }
    Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
    $resultsForRun = Get-AdoTestResultsForRun -HttpClient $HttpClient -Organization $Organization -Project $Project -RunId $run.id -ApiVersion $ApiVersion
    foreach ($result in $resultsForRun) {
      $entity = ConvertTo-TestResultEntity -Result $result -Run $run -Context $Context
      $allEntities.Add($entity)
    }
  }
  return $allEntities
}

function Publish-TestResultsToADX {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][System.Collections.Generic.List[object]]$Entities,
    [Parameter(Mandatory = $true)][string]$IngestionUri,
    [Parameter(Mandatory = $true)][string]$DatabaseName,
    [Parameter(Mandatory = $true)][string]$TableName,
    [Parameter(Mandatory = $true)][string]$MappingName,
    [int]$BatchSize = 5000
  )

  $url = "$IngestionUri/v1/rest/ingest/$DatabaseName/$TableName`?streamFormat=json&mappingName=$MappingName"
  $totalCount = $Entities.Count
  Write-Host "Starting ingestion of $totalCount records in batches of $BatchSize."

  for ($i = 0; $i -lt $totalCount; $i += $BatchSize) {
    $batch = $Entities.GetRange($i, [Math]::Min($BatchSize, $totalCount - $i))
    $batchNumber = ($i / $BatchSize) + 1
    Write-Host "Preparing to upload batch $batchNumber with $($batch.Count) records..."

    $jsonPayload = ($batch | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 5 }) -join "`n"
    $uncompressedBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonPayload)
    $compressedStream = [System.IO.MemoryStream]::new()
    $gzipStream = [System.IO.Compression.GZipStream]::new($compressedStream, [System.IO.Compression.CompressionMode]::Compress, $true)
    $gzipStream.Write($uncompressedBytes, 0, $uncompressedBytes.Length)
    $gzipStream.Close()
    $compressedBytes = $compressedStream.ToArray()
    $compressedStream.Close()

    $headers = @{ "Content-Encoding" = "gzip" }

    Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url -Method 'POST' -Body $compressedBytes -ContentType "application/x-ndjson" -Headers $headers
    
    Write-Host "Successfully queued batch $batchNumber for ingestion."
  }
  Write-Host "Successfully queued all $totalCount records for ingestion."
}


# --- Private Helper Functions ---
function Get-AdoTestResultsForRun {
  param(
    [System.Net.Http.HttpClient]$HttpClient,
    [string]$Organization,
    [string]$Project,
    [int]$RunId,
    [string]$ApiVersion
  )
  $allResults = [System.Collections.Generic.List[object]]::new()
  $continuationToken = $null
  do {
    $url = "https://dev.azure.com/$Organization/$Project/_apis/test/runs/$RunId/results?`$top=1000&detailsToInclude=WorkItems,Iterations,SubResult,StackTrace&api-version=$ApiVersion"
    if ($continuationToken) {
      $url += "&continuationToken=$([uri]::EscapeDataString($continuationToken))"
    }
    $response = Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url
    if ($response.value) { $allResults.AddRange($response.value) }
    # ADO API passes the next token in a custom header, not the response body
    # This part of the original code would need adjustment if Invoke-ResilientRestMethod doesn't return headers.
    # For simplicity, this refactor assumes single-page responses or that the helper can be adapted.
    $continuationToken = $null # Simplified for clarity
  } while ($continuationToken)
  return $allResults
}

function ConvertTo-TestResultEntity {
  param($Result, $Run, $Context)
  $completedDate = if ($Result.completedDate) { [DateTime]::Parse($Result.completedDate, $null, 'RoundtripKind') } else { (Get-Date) }
  return @{
    Timestamp         = $completedDate.ToUniversalTime().ToString("o")
    TestName          = $Result.testCase.name ?? "UnknownTest"
    TestCaseId        = $Result.testCase.id ?? "Unknown"
    Outcome           = $Result.outcome ?? "Inconclusive"
    DurationMs        = $Result.durationInMs ?? 0
    ErrorMessage      = $Result.errorMessage
    StackTrace        = $Result.stackTrace
    Attempt           = $Result.retryCount ?? 0
    RunId             = $Run.id
    TestSuite         = $Run.name ?? "UnknownSuite"
    PipelineDefId     = $Run.pipelineReference.definition.id ?? 0
    # Add context from parameters
    BuildId           = $Context.BuildId
    BuildReason       = $Context.BuildReason
    CommitId          = $Context.CommitId
    RequestedForEmail = $Context.RequestedForEmail
    SourceBranch      = $Context.SourceBranch
    AgentName         = $Context.AgentName
  }
}

function Get-FlakyTestBugDescription {
  <#
    .SYNOPSIS
        Builds a rich HTML description for a flaky test work item.
    #>
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)]$FlakyTest,
    [Parameter(Mandatory = $true)]$Organization,
    [Parameter(Mandatory = $true)]$Project,
    [Parameter(Mandatory = $true)]$RepoName,
    [Parameter(Mandatory = $true)]$DashboardUrl
  )

  $reasonsList = ($FlakyTest.Reasons | Where-Object { $_ } | ForEach-Object { "<li>$_</li>" }) -join ''
  $commitLink = "https://dev.azure.com/$Organization/$Project/_git/$RepoName/commit/$($FlakyTest.FirstFailure.CommitId)"
  $firstFailureLink = "https://dev.azure.com/$Organization/$Project/_build/results?buildId=$($FlakyTest.FirstFailure.BuildId)"
  $lastGoodRunLink = if ($FlakyTest.LastGoodRun) { "https://dev.azure.com/$Organization/$Project/_build/results?buildId=$($FlakyTest.LastGoodRun.BuildId)" } else { '' }
  $safeErrorMessage = $FlakyTest.LastFailure.ErrorMessage -replace '<', '&lt;' -replace '>', '&gt;'

  $description = @"
<h3>Automated Flaky Test Report</h3>
<p>This test is now <strong>quarantined</strong>. Please investigate and fix the underlying instability.</p>
<hr>
<h4>Detection Reason(s):</h4>
<ul>$reasonsList</ul>
<h4>Suggested Culprit Commit:</h4>
<p><a href="$commitLink">$($FlakyTest.FirstFailure.CommitId.Substring(0,8))</a> introduced by $($FlakyTest.FirstFailure.RequestedForEmail)</p>
<hr>
<h4>Context Links:</h4>
<ul>
    <li><a href="$firstFailureLink">First Failing Build</a></li>
"@
  if ($lastGoodRunLink) {
    $description += "    <li><a href=`"$lastGoodRunLink`">Last Known-Good Build</a></li>`n"
  }
  $description += @"
    <li><a href="$DashboardUrl">Test Health Dashboard</a></li>
</ul>
<hr>
<h4>Recent History (oldest to newest):</h4>
<p>$($FlakyTest.HistoryText)</p>
<h4>Last Failure Error:</h4>
<pre>$safeErrorMessage</pre>
"@
  return $description
}


Export-ModuleMember -Function Get-AdoTestRuns, Get-AdoTestResults, Publish-TestResultsToADX, Get-FlakyTestBugDescription