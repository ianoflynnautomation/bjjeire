<#
.SYNOPSIS
    A PowerShell module with reusable functions for interacting with Azure DevOps Test Plans and Azure Data Explorer.
.DESCRIPTION
    This module provides functions to fetch test runs and results, transform the data into structured entities, and publish them to Azure Data Explorer (ADX).
.NOTES
    Version: 1.12
    Author: Staff SDET
    Changes in v1.12:
    - Implemented a more robust error handling mechanism in the catch blocks to resolve the "Cannot access a disposed object" error.
    - The code now reads the error details from the PowerShell ErrorRecord, which is safer than accessing the raw response stream.
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
  
  $queryUrl = "$QueryUri/v1/rest/query"
  
  $kqlQuery = ".show table $TableName"
  
  $queryPayload = @{
    db   = $DatabaseName
    csl  = $kqlQuery
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
    # <<< FIX: Use a more robust method to get the error details to avoid the disposed object exception.
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $errorMessage += " | Response: " + $_.ErrorDetails.Message
    }
    Write-Warning "Verification query failed. This may indicate the table/database is not found or a query syntax error. Full Error: $errorMessage"
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
        Publishes a list of test result entities to Azure Data Explorer using Invoke-RestMethod, based on user feedback.
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
    [string]$AccessToken,
    [int]$BatchSize = 5000
  )

  # Using streamFormat=json as it appears to correctly handle newline-delimited streams.
  $url = "$IngestionUri/v1/rest/ingest/$DatabaseName/$TableName`?streamFormat=json&mappingName=$MappingName"
  
  $totalCount = $Entities.Count
  Write-Host "Starting ingestion of $totalCount records in batches of $BatchSize."

  for ($i = 0; $i -lt $totalCount; $i += $BatchSize) {
    $batch = $Entities | Select-Object -Skip $i -First $BatchSize
    $batchCount = $batch.Count
    $batchNumber = ($i / $BatchSize) + 1
    
    Write-Host "Preparing to upload batch $batchNumber with $batchCount records..."
    
    $jsonPayload = ($batch | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 5 }) -join "`n"

    $uncompressedBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonPayload)
    $compressedStream = [System.IO.MemoryStream]::new()
    $gzipStream = [System.IO.Compression.GZipStream]::new($compressedStream, [System.IO.Compression.CompressionMode]::Compress)
    $gzipStream.Write($uncompressedBytes, 0, $uncompressedBytes.Length)
    $gzipStream.Close()
    $compressedBytes = $compressedStream.ToArray()
    $compressedStream.Close()

    $headers = @{
        "Authorization"    = "Bearer $AccessToken"
        "Content-Type"     = "application/x-ndjson"
        "Content-Encoding" = "gzip"
    }

    $maxRetries = 3
    $retryDelaySec = 15
    for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
        try {
            Write-Host "Uploading compressed batch $batchNumber (size: $($compressedBytes.Length) bytes) to URL: $url"
            Invoke-RestMethod -Uri $url -Method 'POST' -Body $compressedBytes -Headers $headers -ErrorAction Stop
            Write-Host "Successfully queued batch $batchNumber for ingestion."
            break 
        }
        catch {
            $errorMessage = $_.Exception.Message
            if ($_.ErrorDetails.Message) {
                $errorMessage += " | Response: " + $_.ErrorDetails.Message
            }
            
            if ($attempt -lt $maxRetries) {
                $delay = $retryDelaySec * $attempt
                Write-Warning "Failed to ingest batch $batchNumber on attempt $attempt. Error: $errorMessage"
                Write-Warning "Waiting for $delay seconds before retrying..."
                Start-Sleep -Seconds $delay
            }
            else {
                throw "Failed to ingest data to ADX on batch $batchNumber after $maxRetries attempts. Final Error: $errorMessage"
            }
        }
    }
  }
  Write-Host "Successfully queued all $totalCount records for ingestion."
}

#endregion

Export-ModuleMember -Function *
