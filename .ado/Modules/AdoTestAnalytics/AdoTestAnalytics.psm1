<#
.SYNOPSIS
    A PowerShell module with reusable functions for interacting with Azure DevOps Test Plans and Azure Table Storage.
.DESCRIPTION
    This module provides functions to fetch test runs and results, transform the data into structured entities, and publish them to Azure Table Storage.
    It is designed to be imported into other scripts to provide a standardized way of collecting test analytics data.
.NOTES
    Version: 1.0
    Author:
#>

#region Reusable Functions

function Invoke-AdoRestMethodAsyncWithRetry {
  <#
    .SYNOPSIS
        Performs a GET request to the Azure DevOps REST API with retry logic.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [int]$MaxRetries = 3,
    [int]$RetryDelaySec = 5
  )

  for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
    try {
      Write-Host "##vso[task.debug]Attempting to GET: $Uri (Attempt $attempt of $MaxRetries)"
      $response = $HttpClient.GetAsync($Uri).GetAwaiter().GetResult()
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
        Transforms a raw test result object from the API into a structured entity for Azure Table Storage.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [object]$Result,
    [Parameter(Mandatory = $true)]
    [object]$Run,
    [Parameter(Mandatory = $true)]
    [int]$BuildId
  )
  $partitionKeyName = if (-not [string]::IsNullOrEmpty($Run.pipelineReference.definition.name)) {
    $Run.pipelineReference.definition.name
  }
  elseif (-not [string]::IsNullOrEmpty($Run.build.definition)) {
    $Run.build.definition
  }
  elseif (-not [string]::IsNullOrEmpty($Run.name)) {
    $Run.name
  }
  else {
    "Build_$BuildId"
  }
  $partitionKey = $partitionKeyName.Replace(" ", "_").Replace("/", "_")

  $completedDate = if ($Result.completedDate) { [DateTime]::Parse($Result.completedDate, $null, 'RoundtripKind') } else { (Get-Date) }
  $reversedTicks = "{0:D19}" -f ([DateTime]::MaxValue.Ticks - $completedDate.ToUniversalTime().Ticks)
  $rowKey = "{0}_{1}" -f $reversedTicks, $Result.id

  return @{
    PartitionKey      = $partitionKey
    RowKey            = $rowKey
    Timestamp         = $completedDate.ToUniversalTime()
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
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.List[object]]$Entities,
    [Parameter(Mandatory = $true)]
    [string]$IngestionUri, # e.g., https://ingest-yourcluster.kusto.windows.net
    [Parameter(Mandatory = $true)]
    [string]$DatabaseName,
    [Parameter(Mandatory = $true)]
    [string]$TableName,
    [Parameter(Mandatory = $true)]
    [string]$MappingName,
    [Parameter(Mandatory = $true)]
    [System.Net.Http.HttpClient]$HttpClient # The client should already be authenticated
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
    # The helper function will have already logged warnings, but we can add a final error.
    Write-Error "Failed to ingest data to ADX after multiple retries."
  }
}

function Publish-TestResultEntities {
  <#
    .SYNOPSIS
        Publishes a list of test result entities to Azure Table Storage in efficient batches.
    #>
  param(
    [Parameter(Mandatory = $true)]
    [Microsoft.Azure.Cosmos.Table.CloudTable]$CloudTable,
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.List[object]]$Entities,
    [Parameter(Mandatory = $true)]
    [int]$BatchSize
  )
  $entityGroups = $Entities | Group-Object PartitionKey
  Write-Host "Uploading entities in $($entityGroups.Count) partition groups..."

  foreach ($group in $entityGroups) {
    $partitionEntities = $group.Group
    $partitionName = $group.Name
    Write-Host "Processing partition '$partitionName' with $($partitionEntities.Count) entities."

    $batchCount = [math]::Ceiling($partitionEntities.Count / $BatchSize)
    for ($i = 0; $i -lt $batchCount; $i++) {
      $batch = $partitionEntities | Select-Object -Skip ($i * $BatchSize) -First $BatchSize
      $batchNum = $i + 1
            
      $batchOperation = New-Object -TypeName Microsoft.Azure.Cosmos.Table.TableBatchOperation
      foreach ($entity in $batch) {
        $tableEntity = New-Object -TypeName Microsoft.Azure.Cosmos.Table.DynamicTableEntity -ArgumentList $entity.PartitionKey, $entity.RowKey
        $entity.GetEnumerator() | Where-Object { $_.Key -notin @('PartitionKey', 'RowKey') -and $null -ne $_.Value } | ForEach-Object {
          $tableEntity.Properties.Add($_.Key, $_.Value)
        }
        $batchOperation.InsertOrReplace($tableEntity)
      }

      try {
        Write-Host "Uploading batch $batchNum of $batchCount for partition '$partitionName'..."
        $CloudTable.ExecuteBatch($batchOperation) | Out-Null
      }
      catch {
        Write-Host "##vso[task.logissue type=warning]Batch $batchNum for partition '$partitionName' failed: $($_.Exception.Message). Attempting individual uploads."
        foreach ($entity in $batch) {
          try {
            $individualEntity = New-Object -TypeName Microsoft.Azure.Cosmos.Table.DynamicTableEntity -ArgumentList $entity.PartitionKey, $entity.RowKey
            $entity.GetEnumerator() | Where-Object { $_.Key -notin @('PartitionKey', 'RowKey') -and $null -ne $_.Value } | ForEach-Object {
              $individualEntity.Properties.Add($_.Key, $_.Value)
            }
            $operation = [Microsoft.Azure.Cosmos.Table.TableOperation]::InsertOrReplace($individualEntity)
            $CloudTable.Execute($operation) | Out-Null
          }
          catch {
            Write-Host "##vso[task.logissue type=error]Failed to upload individual entity with RowKey '$($entity.RowKey)': $($_.Exception.Message)"
          }
        }
      }
    }
  }
}

#endregion

Export-ModuleMember -Function *
