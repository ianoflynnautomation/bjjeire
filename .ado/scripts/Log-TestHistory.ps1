<#
.SYNOPSIS
    Fetches all test results for a build and logs them in batches to Azure Table Storage.
.DESCRIPTION
    This script queries all test runs for a given build, iterates through all test results using proper pagination,
    and logs the results efficiently in batches to Azure Table Storage.
    This historical data is the foundation for calculating Flaky Test Rate and MTTR.
.PARAMETER Organization
    Your Azure DevOps organization name.
.PARAMETER Project
    Your Azure DevOps project name.
.PARAMETER BuildId
    The ID of the build to process.
.PARAMETER Pat
    A Personal Access Token (PAT) or the System.AccessToken for authentication.
.PARAMETER StorageConnectionString
    The connection string for the Azure Storage Account where the "TestResultHistory" table exists.
.EXAMPLE
    ./Log-TestHistory.ps1 -Organization "my-org" -Project "my-project" -BuildId $(Build.BuildId) -Pat $env:SYSTEM_ACCESSTOKEN -StorageConnectionString "your-connection-string"
#>
[CmdletBinding()]
param (
  [Parameter(Mandatory = $true)]
  [string]$Organization,

  [Parameter(Mandatory = $true)]
  [string]$Project,

  [Parameter(Mandatory = $true)]
  [int]$BuildId,

  [Parameter(Mandatory = $true)]
  [string]$Pat,

  [Parameter(Mandatory = $true)]
  [string]$StorageConnectionString,

  [Parameter(Mandatory = $false)]
  [string]$ApiVersion = '7.1',
  
  [Parameter(Mandatory = $false)]
  [string]$TableName = 'TestResultHistory'
)

# Set up authentication headers for Azure DevOps API
$headers = @{
  Authorization  = "Bearer $Pat"
  "Content-Type" = "application/json"
}

function Write-BatchToDataStore {
  param(
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.List[Microsoft.Azure.Cosmos.Table.TableEntity]]$AllResults,
    [Parameter(Mandatory = $true)]
    [Microsoft.Azure.Cosmos.Table.CloudTable]$Table
  )

  Write-Host "Preparing to upload $($AllResults.Count) test results..."

  # Group results by PartitionKey. Batch operations in Azure Table Storage
  # are scoped to a single partition.
  $resultsByPartition = $AllResults | Group-Object -Property PartitionKey

  foreach ($partitionGroup in $resultsByPartition) {
    $partitionKey = $partitionGroup.Name
    $records = $partitionGroup.Group
    $recordCount = $records.Count
    Write-Host "Processing partition '$partitionKey' with $recordCount records."

    $batchOperation = New-Object Microsoft.Azure.Cosmos.Table.TableBatchOperation
    $i = 0

    foreach ($record in $records) {
      $batchOperation.Insert($record)
      $i++

      # Azure Table Storage batches are limited to 100 operations.
      # When the batch is full or we are at the last record, execute it.
      if ($batchOperation.Count -ge 100 -or $i -eq $recordCount) {
        try {
          $Table.ExecuteBatch($batchOperation)
          Write-Host "Successfully uploaded batch of $($batchOperation.Count) records for partition '$partitionKey'."
          $batchOperation.Clear()
        }
        catch {
          Write-Error "Failed to execute batch for partition '$partitionKey'. Error: $_"
        }
      }
    }
  }
}

try {
  # Establish connection to Azure Table Storage
  Write-Host "Connecting to Azure Storage..."
  # The following line implicitly loads the necessary Az.Storage assemblies
  $storageAccount = [Microsoft.Azure.Cosmos.Table.CloudStorageAccount]::Parse($StorageConnectionString)
  $tableClient = $storageAccount.CreateCloudTableClient()
  $table = $tableClient.GetTableReference($TableName)
  $table.CreateIfNotExists()

  # FIX: The class definition is moved inside the 'try' block.
  # This ensures that the required .NET types from the Az.Storage module (like TableEntity)
  # have been loaded into the PowerShell session before this class is parsed.
  class TestResultEntity {
    [string]$TestName
    [string]$Outcome
    [int]$BuildId
    [double]$Duration
    [string]$TestSuite
    [string]$BuildDefinition

    TestResultEntity() {}
    TestResultEntity($PartitionKey, $RowKey) {
      $this.PartitionKey = $PartitionKey
      $this.RowKey = $RowKey
    }
  }

  # --- Data Collection ---
  $allTestResults = New-Object System.Collections.Generic.List[TestResultEntity]

  Write-Host "Fetching test runs for build '$BuildId'..."
  $testRunsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs?buildIds=$BuildId&api-version=$ApiVersion"
  $testRunsResponse = Invoke-RestMethod -Uri $testRunsUrl -Method Get -Headers $headers -ErrorAction Stop
    
  if (-not $testRunsResponse.value) {
    Write-Warning "No test runs found for Build ID $BuildId."
    return
  }

  foreach ($run in $testRunsResponse.value) {
    Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
    $continuationToken = $null
    $page = 1

    do {
      # Construct URL for fetching results, include continuation token if present
      $resultsUrl = "https://dev.azure.com/$($Organization)/$($Project)/_apis/test/runs/$($run.id)/results?`$top=1000&api-version=$ApiVersion"
      if ($continuationToken) {
        $resultsUrl += "&continuationToken=$([uri]::EscapeDataString($continuationToken))"
      }

      $response = Invoke-RestMethod -Uri $resultsUrl -Method Get -Headers $headers -ResponseHeadersVariable responseHeaders -ErrorAction Stop
      $results = $response.value

      Write-Host "Fetched page $page with $($results.Count) results."

      foreach ($result in $results) {
        # Create a strongly-typed entity for the batch operation.
        # A good RowKey ensures uniqueness and is queryable.
        # Format: {BuildId}_{TestResultId}
        $partitionKey = $run.pipelineReference.pipelineDefinition.name
        $rowKey = "$($BuildId)_$($result.id)"

        $entity = [TestResultEntity]::new($partitionKey, $rowKey)
        $entity.TestName = $result.testCase.name
        $entity.Outcome = $result.outcome
        $entity.BuildId = $BuildId
        $entity.Duration = $result.durationInMs
        $entity.TestSuite = $run.name
        $entity.BuildDefinition = $run.pipelineReference.pipelineDefinition.name

        $allTestResults.Add($entity)
      }
            
      # Check for the continuation token to see if there's more data
      $continuationToken = $responseHeaders['x-ms-continuationtoken']
      $page++

    } while ($continuationToken)
  }

  # --- Data Ingestion ---
  if ($allTestResults.Count -gt 0) {
    # Note: The function parameter type is updated to be more generic to avoid parsing issues.
    Write-BatchToDataStore -AllResults $allTestResults -Table $table
  }
  else {
    Write-Host "No test results found to log."
  }

  Write-Host "Script completed successfully."
}
catch {
  Write-Error "An error occurred: $_"
  # Dump the full error record for better debugging in pipelines
  Write-Error $_.Exception.ToString()
  exit 1
}
