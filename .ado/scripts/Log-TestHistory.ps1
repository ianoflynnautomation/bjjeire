<#
.SYNOPSIS
    Fetches all test results for a build and logs them in batches to Azure Table Storage.
.DESCRIPTION
    This script queries all test runs for a given build, iterates through all test results using proper pagination,
    and logs the results efficiently in batches to Azure Table Storage.
    This historical data is the foundation for calculating Flaky Test Rate and MTTR.
.NOTES
    Version: 1.0
    Author: 
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
  [string]$TableName = 'TestResultHistory',

  [Parameter(Mandatory = $false)]
  [int]$BatchSize = 100 # Azure Table Storage batch operations are limited 
)

# $headers = @{
#   Authorization  = "Bearer $Pat"
#   "Content-Type" = "application/json"
# }

# Helper function for resilient API calls with retry logic
# function Invoke-AdoRestMethodWithRetry {
#   param(
#     [string]$Uri,
#     [string]$Method = 'GET',
#     [hashtable]$Headers,
#     [int]$MaxRetries = 3,
#     [int]$RetryDelaySec = 5,
#     [string]$ResponseHeadersVariable
#   )
#   for ($i = 1; $i -le $MaxRetries; $i++) {
#     try {
#       $params = @{
#         Uri         = $Uri
#         Method      = $Method
#         Headers     = $Headers
#         ErrorAction = 'Stop'
#       }
#       if ($ResponseHeadersVariable) {
#         $params.Add('ResponseHeadersVariable', $ResponseHeadersVariable)
#       }
#       return Invoke-RestMethod @params
#     }
#     catch {
#       Write-Warning "API call to '$Uri' failed on attempt $i. Error: $($_.Exception.Message)"
#       if ($i -lt $MaxRetries) {
#         Start-Sleep -Seconds ($RetryDelaySec * $i) # Exponential backoff
#       }
#       else {
#         throw "Failed to call API after $MaxRetries attempts."
#       }
#     }
#   }
# }

# $startTime = Get-Date

try {
  Import-Module -Name Az.Storage -ErrorAction Stop
  Import-Module -Name Az.Resources -ErrorAction Stop
  Import-Module -Name AzTable -ErrorAction Stop

  Write-Host "##vso[task.debug]Validating input parameters..."
  if ([string]::IsNullOrWhiteSpace($StorageConnectionString)) {
    Write-Host "##vso[task.logissue type=error]StorageConnectionString is null or empty. Please provide a valid Azure Storage connection string."
    Write-Host "##vso[task.complete result=Failed]"
    exit 1
  }
  if ([string]::IsNullOrWhiteSpace($Pat)) {
    Write-Host "##vso[task.logissue type=error]Pat is null or empty. Please provide a valid Personal Access Token."
    Write-Host "##vso[task.complete result=Failed]"
    exit 1
  }

  # Initialize Azure Storage module and context
  Import-Module -Name Az.Storage -ErrorAction Stop
  Write-Host "##vso[task.debug]Initializing Azure Storage context with connection string..."
  $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString -ErrorAction Stop

  # Initialize HTTP client for async API calls
  Add-Type -AssemblyName System.Net.Http
  $httpClient = [System.Net.Http.HttpClient]::new()
  $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)
  $httpClient.DefaultRequestHeaders.Add("Accept", "application/json")

  # Get or create table
  Write-Host "##vso[task.debug]Checking for table '$TableName'..."
  $tableRef = Get-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction SilentlyContinue
  if (-not $tableRef) {
    Write-Host "Creating table '$TableName'..."
    $tableRef = New-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction Stop
  }
  $cloudTable = $tableRef.CloudTable

  # Fetch test runs
  Write-Host "##vso[task.debug]Fetching test runs for Build ID $BuildId..."
  $testRunsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs?buildIds=$BuildId&includeRunDetails=true&api-version=$ApiVersion"
  $response = $httpClient.GetAsync($testRunsUrl).GetAwaiter().GetResult()
  if (-not $response.IsSuccessStatusCode) {
    Write-Host "##vso[task.logissue type=error]Failed to fetch test runs: $($response.StatusCode)"
    Write-Host "##vso[task.complete result=Failed]"
    exit 1
  }
  $testRunsResponse = ($response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)

  if (-not $testRunsResponse.value) {
    Write-Host "No test runs found for Build ID $BuildId."
    Write-Host "##vso[task.setvariable variable=TestRunCount]0"
    Write-Host "##vso[task.complete result=Succeeded]"
    exit 0
  }

  Write-Host "##vso[task.setvariable variable=TestRunCount]$($testRunsResponse.value.Count)"
  $allEntities = [System.Collections.Generic.List[object]]::new()

  foreach ($run in $testRunsResponse.value) {
    if ($run.name -eq 'Aggregated Test Results') {
      Write-Host "##vso[task.debug]Skipping aggregated run '$($run.name)' (ID: $($run.id))."
      continue
    }

    Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
    $continuationToken = $null
    $page = 1

    do {
      $resultsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs/$($run.id)/results?`$top=1000&detailsToInclude=WorkItems,Iterations,SubResult,StackTrace&api-version=$ApiVersion"
      if ($continuationToken) {
        $resultsUrl += "&continuationToken=$([uri]::EscapeDataString($continuationToken))"
      }

      Write-Host "##vso[task.debug]Fetching page $page of test results for run $($run.id)..."
      $response = $httpClient.GetAsync($resultsUrl).GetAwaiter().GetResult()
      if (-not $response.IsSuccessStatusCode) {
        Write-Host "##vso[task.logissue type=error]Failed to fetch test results for run $($run.id): $($response.StatusCode)"
        Write-Host "##vso[task.complete result=Failed]"
        exit 1
      }
      $results = ($response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json).value

      Write-Host "Fetched page $page with $($results.Count) results for run $($run.id)."
      foreach ($result in $results) {
        $partitionKey = "$($run.pipelineReference.definition.name)_$($run.name)"
        $rowKey = "{0:D19}_{1}_{2}" -f (Get-Date).ToUniversalTime().Ticks, $result.testCase.id, $run.id

        $entity = @{
          PartitionKey = $partitionKey
          RowKey       = $rowKey
          Timestamp    = (Get-Date).ToUniversalTime()
          TestName     = $result.testCase.name ?? "UnknownTest"
          TestCaseId   = $result.testCase.id ?? "Unknown"
          Outcome      = $result.outcome ?? "Inconclusive"
          BuildId      = $BuildId
          RunId        = $run.id
          DurationMs   = $result.durationInMs ?? 0
          ErrorMessage = $result.errorMessage
          StackTrace   = $result.stackTrace
          RetryCount   = $result.retryCount ?? 0
          Environment  = $env:TEST_ENVIRONMENT ?? "Unknown"
          AgentName    = $env:AGENT_NAME ?? "Unknown"
          SourceBranch = $env:BUILD_SOURCEBRANCHNAME ?? "Unknown"
          TestCategory = $result.testCase.category ?? "Unknown"
        }
        $allEntities.Add($entity)
      }

      # Check if continuation token exists before accessing it
      $continuationToken = $null
      if ($response.Headers.Contains("x-ms-continuationtoken")) {
        $continuationToken = $response.Headers.GetValues("x-ms-continuationtoken") | Select-Object -First 1
        Write-Host "##vso[task.debug]Continuation token found for page $page : $continuationToken"
      }
      else {
        Write-Host "##vso[task.debug]No continuation token for page $page. All results fetched."
      }
      $page++
    } while ($continuationToken)
  }

  # Batch entities by PartitionKey
  if ($allEntities.Count -gt 0) {
    Write-Host "Uploading $($allEntities.Count) test results in batches of $BatchSize..."
    Write-Host "##vso[task.setvariable variable=EntityCount]$($allEntities.Count)"

    $entityGroups = $allEntities | Group-Object PartitionKey
    foreach ($group in $entityGroups) {
      $batchCount = [math]::Ceiling($group.Group.Count / $BatchSize)
      for ($i = 0; $i -lt $batchCount; $i++) {
        $batch = $group.Group | Select-Object -Skip ($i * $BatchSize) -First $BatchSize
        try {
          Add-AzTableRow -Table $cloudTable -Entity $batch -ErrorAction Stop
          Write-Host "Uploaded batch $($i+1) of $batchCount for partition '$($group.Name)'."
        }
        catch {
          Write-Host "##vso[task.logissue type=warning]Batch $($i+1) for partition '$($group.Name)' failed: $_"
          foreach ($entity in $batch) {
            try {
              Add-AzTableRow -Table $cloudTable -PartitionKey $entity.PartitionKey -RowKey $entity.RowKey -Property $entity -ErrorAction Stop
            }
            catch {
              Write-Host "##vso[task.logissue type=warning]Failed to upload entity '$($entity.RowKey)' in partition '$($group.Name)': $_"
            }
          }
        }
      }
    }
  }
  else {
    Write-Host "No test results to log."
    Write-Host "##vso[task.setvariable variable=EntityCount]0"
  }

  # Log execution duration
  # $durationMs = ((Get-Date) - $startTime).TotalMilliseconds
  # Write-Host "##vso[task.setvariable variable=ScriptDurationMs]$durationMs"
  # Write-Host "Script completed successfully in $durationMs ms."
  Write-Host "##vso[task.complete result=Succeeded]"
}
catch {
  Write-Host "##vso[task.logissue type=error]Critical error: $_"
  Write-Host "##vso[task.complete result=Failed]"
  exit 1
}
finally {
  $httpClient.Dispose()
}