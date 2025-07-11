<#
.SYNOPSIS
    A PowerShell module with reusable functions for interacting with Azure DevOps Test Plans and Azure Data Explorer.
.DESCRIPTION
    This module provides functions to fetch test runs and results, transform the data into structured entities, and publish them to Azure Data Explorer (ADX).
.NOTES
    Version: 1.9
    Author: Staff SDET
    Changes in v1.9:
    - Refactored all API calls (Azure DevOps and ADX) to use Invoke-RestMethod exclusively.
    - Removed System.Net.Http.HttpClient dependency entirely to resolve the "term not recognized" error.
    - Simplified functions to pass access tokens directly.
    - Updated Get-AdoTestResultsForRun to use the -ResponseHeadersVariable parameter to handle pagination.
#>

#region Reusable Functions

function Get-AdxAccessToken {
  <#
    .SYNOPSIS
        Gets an authenticated access token for Azure Data Explorer using a Service Principal.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [string]$KustoClusterUri,
    [Parameter(Mandatory = $true)]
    [string]$AppClientId,
    [Parameter(Mandatory = $true)]
    [string]$AppClientSecret,
    [Parameter(Mandatory = $true)]
    [string]$TenantId
  )
  Write-Host "Authenticating to Azure Data Explorer cluster: $KustoClusterUri"
  $authUrl = "https://login.microsoftonline.com/$TenantId/oauth2/token"
  $authBody = "grant_type=client_credentials&client_id=$AppClientId&client_secret=$AppClientSecret&resource=$KustoClusterUri"
  $tokenResponse = Invoke-RestMethod -Uri $authUrl -Method Post -Body $authBody -ContentType 'application/x-www-form-urlencoded'
  return $tokenResponse.access_token
}

function Test-AdxTableExists {
  <#
    .SYNOPSIS
        Checks if a specific table exists in an ADX database using Invoke-RestMethod.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [string]$AccessToken,
    [Parameter(Mandatory = $true)]
    [string]$QueryUri,
    [Parameter(Mandatory = $true)]
    [string]$DatabaseName,
    [Parameter(Mandatory = $true)]
    [string]$TableName
  )
  
  $queryUrl = "$QueryUri/v2/rest/query"
  $kqlQuery = ".show table `"$TableName`" details | count"
  $queryPayload = @{
    db  = $DatabaseName
    csl = $kqlQuery
  } | ConvertTo-Json

  $headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Accept"        = "application/json"
    "Content-Type"  = "application/json"
  }

  try {
    Invoke-RestMethod -Uri $queryUrl -Method 'POST' -Body $queryPayload -Headers $headers -ErrorAction Stop
    return $true
  }
  catch {
    Write-Warning "Verification query failed. This may indicate the table/database is not found. Error: $($_.Exception.Message)"
    return $false
  }
}

function Get-AdoTestRuns {
  <#
    .SYNOPSIS
        Fetches all test runs for a specific build ID using Invoke-RestMethod.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [string]$AccessToken,
    [Parameter(Mandatory = $true)]
    [string]$Organization,
    [Parameter(Mandatory = $true)]
    [string]$Project,
    [Parameter(Mandatory = $true)]
    [int]$BuildId,
    [Parameter(Mandatory = $true)]
    [string]$ApiVersion
  )
  $testRunsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs?buildIds=$BuildId&includeRunDetails=true&api-version=$ApiVersion"
  $headers = @{ "Authorization" = "Bearer $AccessToken" }
  
  try {
    $response = Invoke-RestMethod -Uri $testRunsUrl -Headers $headers -Method Get -ErrorAction Stop
    return $response.value
  }
  catch {
    throw "Failed to get test runs from Azure DevOps. Error: $($_.Exception.Message)"
  }
}

function Get-AdoTestResultsForRun {
  <#
    .SYNOPSIS
        Fetches all test results for a single test run, handling API pagination using Invoke-RestMethod.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [string]$AccessToken,
    [Parameter(Mandatory = $true)]
    [string]$Organization,
    [Parameter(Mandatory = $true)]
    [string]$Project,
    [Parameter(Mandatory = $true)]
    [object]$Run,
    [Parameter(Mandatory = $true)]
    [string]$ApiVersion
  )
  $allResults = [System.Collections.Generic.List[object]]::new()
  $continuationToken = $null
  $page = 1
  $headers = @{ "Authorization" = "Bearer $AccessToken" }

  do {
    $resultsUrl = "https://dev.azure.com/$($Organization)/$($Project)/_apis/test/runs/$($Run.id)/results?`$top=1000&detailsToInclude=WorkItems,Iterations,SubResult,StackTrace&api-version=$ApiVersion"
    if ($continuationToken) {
      $resultsUrl += "&continuationToken=$([uri]::EscapeDataString($continuationToken))"
    }

    try {
      $responseHeaders = $null
      $resultsResponse = Invoke-RestMethod -Uri $resultsUrl -Headers $headers -Method Get -ResponseHeadersVariable responseHeaders -ErrorAction Stop
          
      if ($resultsResponse.value) {
        Write-Host "Fetched page $page with $($resultsResponse.value.Count) results for run $($Run.id)."
        $allResults.AddRange($resultsResponse.value)
      }

      $continuationToken = $null
      if ($responseHeaders.ContainsKey("x-ms-continuationtoken")) {
        $continuationToken = $responseHeaders["x-ms-continuationtoken"]
        Write-Host "##vso[task.debug]Continuation token found. More results to fetch."
      }
      $page++
    }
    catch {
      throw "Failed to get test results for run '$($Run.id)'. Error: $($_.Exception.Message)"
    }
  } while ($continuationToken)

  return $allResults
}

function ConvertTo-TestResultEntity {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Result,
    [Parameter(Mandatory = $true)]
    [object]$Run,
    [Parameter(Mandatory = $true)]
    [int]$BuildId
  )
  $completedDate = if ($Result.completedDate) { [DateTime]::Parse($Result.completedDate, $null, 'RoundtripKind') } else { (Get-Date) }
  return @{
    Timestamp         = $completedDate.ToUniversalTime().ToString("o")
    TestName          = $Result.testCase.name ?? "UnknownTest"
    TestCaseId        = $Result.testCase.id ?? "Unknown"
    Outcome           = $Result.outcome ?? "Inconclusive"
    BuildId           = $BuildId
    BuildReason       = $env:BUILD_REASON ?? "Unknown"
    RunId             = $Run.id
    TestSuite         = $Run.name ?? "UnknownSuite"
    DurationMs        = $Result.durationInMs ?? 0
    ErrorMessage      = $Result.errorMessage
    StackTrace        = $Result.stackTrace
    Attempt           = $Result.retryCount ?? 0
    PipelineDefId     = $Run.pipelineReference.definition.id ?? 0
    CommitId          = $env:BUILD_SOURCEVERSION ?? "Unknown"
    RequestedForEmail = $env:BUILD_REQUESTEDFOREMAIL ?? "N/A"
    SourceBranch      = $env:BUILD_SOURCEBRANCHNAME ?? "Unknown"
    AgentName         = $env:AGENT_NAME ?? "Unknown"
  }
}

function Publish-TestResultsToADX {
  <#
    .SYNOPSIS
        Publishes a list of test result entities to Azure Data Explorer using Invoke-RestMethod.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.List[object]]$Entities,
    [Parameter(Mandatory = $true)]
    [string]$IngestionUri,
    [Parameter(Mandatory = $true)]
    [string]$DatabaseName,
    [Parameter(Mandatory = $true)]
    [string]$TableName,
    [Parameter(Mandatory = $true)]
    [string]$MappingName,
    [Parameter(Mandatory = $true)]
    [string]$AccessToken
  )

  $jsonPayload = ($Entities | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 5 }) -join "`n"
  $url = "$IngestionUri/$DatabaseName/$TableName`?streamFormat=multijson&mappingName=$MappingName"
  Write-Host "Uploading $($Entities.Count) records to Azure Data Explorer via URL: $url"
    
  $headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/x-ndjson"
  }

  try {
    Invoke-RestMethod -Uri $url -Method 'POST' -Body $jsonPayload -Headers $headers -ErrorAction Stop
    Write-Host "Successfully queued data for ingestion into ADX."
  }
  catch {
    $errorMessage = $_.Exception.Message
    if ($_.Exception.Response) {
      $responseStream = $_.Exception.Response.GetResponseStream()
      $streamReader = [System.IO.StreamReader]::new($responseStream)
      $responseBody = $streamReader.ReadToEnd()
      $streamReader.Close()
      $errorMessage += " Response Body: $responseBody"
    }
    throw "Failed to ingest data to ADX. Error: $errorMessage"
  }
}

#endregion

Export-ModuleMember -Function *
