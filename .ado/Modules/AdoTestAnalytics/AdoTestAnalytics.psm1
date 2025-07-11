<#
.SYNOPSIS
    A PowerShell module with reusable functions for interacting with Azure DevOps Test Plans and Azure Data Explorer.
.DESCRIPTION
    This module provides functions to fetch test runs and results, transform the data into structured entities, and publish them to Azure Data Explorer (ADX).
.NOTES
    Version: 1.4
    Author: Staff SDET
    Changes in v1.4:
    - Upgraded `Invoke-AdoRestMethodAsyncWithRetry` to be a generic helper supporting POST/PATCH methods to fix the ingestion error.
#>

#region Reusable Functions

function Invoke-AdoRestMethodAsyncWithRetry {
    <#
    .SYNOPSIS
        Performs a resilient request to a REST API, supporting different methods and retry logic.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Http.HttpClient]$HttpClient,
        [Parameter(Mandatory = $true)]
        [string]$Uri,
        [string]$Method = 'GET',
        [string]$Body,
        [string]$ContentType = "application/json",
        [int]$MaxRetries = 3,
        [int]$RetryDelaySec = 5
    )

    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        try {
            Write-Host "##vso[task.debug]Attempting to $Method : $Uri (Attempt $attempt of $MaxRetries)"
            $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::$Method, $Uri)
            if ($Body) {
                $request.Content = [System.Net.Http.StringContent]::new($Body, [System.Text.Encoding]::UTF8, $ContentType)
            }

            $response = $HttpClient.SendAsync($request).GetAwaiter().GetResult()

            if ($response.IsSuccessStatusCode) {
                return $response
            }
            else {
                $errorContent = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                Write-Warning "API call failed with status code $($response.StatusCode). Response: $errorContent"
            }
        }
        catch {
            Write-Warning "Exception during API call on attempt $attempt : $($_.Exception.Message)"
        }
        if ($attempt -lt $MaxRetries) {
            $delay = $RetryDelaySec * $attempt
            Write-Warning "Waiting for $delay seconds before retrying..."
            Start-Sleep -Seconds $delay
        }
        else {
            throw "Failed to call API '$Uri' after $MaxRetries attempts."
        }
    }
}

function Get-AdoTestRuns {
    <#
    .SYNOPSIS
        Fetches all test runs for a specific build ID.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Http.HttpClient]$HttpClient,
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
    $response = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $HttpClient -Uri $testRunsUrl
    return ($response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json).value
}

function Get-AdoTestResultsForRun {
    <#
    .SYNOPSIS
        Fetches all test results for a single test run, handling API pagination.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [System.Net.Http.HttpClient]$HttpClient,
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

  do {
    $resultsUrl = "https://dev.azure.com/$($Organization)/$($Project)/_apis/test/runs/$($Run.id)/results?`$top=1000&detailsToInclude=WorkItems,Iterations,SubResult,StackTrace&api-version=$ApiVersion"
    if ($continuationToken) {
      $resultsUrl += "&continuationToken=$([uri]::EscapeDataString($continuationToken))"
    }

    $resultsResponse = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $HttpClient -Uri $resultsUrl
    $resultsData = ($resultsResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)
        
    if ($resultsData.value) {
      Write-Host "Fetched page $page with $($resultsData.value.Count) results for run $($Run.id)."
      $allResults.AddRange($resultsData.value)
    }

    $continuationToken = $null
    if ($resultsResponse.Headers.Contains("x-ms-continuationtoken")) {
      $continuationToken = $resultsResponse.Headers.GetValues("x-ms-continuationtoken") | Select-Object -First 1
      Write-Host "##vso[task.debug]Continuation token found. More results to fetch."
    }
    $page++
  } while ($continuationToken)

  return $allResults
}

function ConvertTo-TestResultEntity {
    <#
    .SYNOPSIS
        Transforms a raw test result object from the API into a structured entity for Kusto ingestion.
    #>
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
        Publishes a list of test result entities to Azure Data Explorer using the resilient helper function.
    #>
    param(
        [Parameter(Mandatory=$true)]
        [System.Collections.Generic.List[object]]$Entities,
        [Parameter(Mandatory=$true)]
        [string]$IngestionUri,
        [Parameter(Mandatory=$true)]
        [string]$DatabaseName,
        [Parameter(Mandatory=$true)]
        [string]$TableName,
        [Parameter(Mandatory=$true)]
        [string]$MappingName,
        [Parameter(Mandatory=$true)]
        [System.Net.Http.HttpClient]$HttpClient
    )

    # ADX ingestion prefers one JSON object per line in the payload.
    $jsonPayload = ($Entities | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 5 }) -join "`n"

    $url = "$IngestionUri/v1/rest/ingest/$DatabaseName/$TableName`?streamFormat=multijson&mappingName=$MappingName"

    Write-Host "Uploading $($Entities.Count) records to Azure Data Explorer..."
    
    # Use the generic helper function for the POST request
    $response = Invoke-AdoRestMethodAsyncWithRetry `
        -HttpClient $HttpClient `
        -Uri $url `
        -Method 'POST' `
        -Body $jsonPayload `
        -ContentType 'application/json'

    if ($response.IsSuccessStatusCode) {
        Write-Host "Successfully queued data for ingestion into ADX."
    }
    else {
        Write-Error "Failed to ingest data to ADX after multiple retries."
    }
}

#endregion

Export-ModuleMember -Function *
