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

$startTime = [System.Diagnostics.Stopwatch]::StartNew()
$httpClient = $null # Initialize here for the finally block

#region Helper Functions

# Asynchronous, resilient API call function with retry logic and exponential backoff.
function Invoke-AdoRestMethodAsyncWithRetry {
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

#endregion

try {
    #region Initialization
    Write-Host "Importing required PowerShell modules..."
    Import-Module -Name Az.Storage -ErrorAction Stop
    Import-Module -Name AzTable -ErrorAction Stop

    Write-Host "Initializing HttpClient for asynchronous API calls..."
    Add-Type -AssemblyName System.Net.Http
    $httpClient = [System.Net.Http.HttpClient]::new()
    $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)
    $httpClient.DefaultRequestHeaders.Add("Accept", "application/json")

    Write-Host "Initializing Azure Storage context..."
    $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString -ErrorAction Stop

    Write-Host "Verifying Azure Storage Table '$TableName'..."
    $tableRef = Get-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction SilentlyContinue
    if (-not $tableRef) {
        Write-Host "Table '$TableName' not found. Creating it..."
        $tableRef = New-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction Stop
    }
    $cloudTable = $tableRef.CloudTable
    #endregion

    #region Fetch Test Runs
    Write-Host "Fetching test runs for Build ID $BuildId..."
    $testRunsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs?buildIds=$BuildId&includeRunDetails=true&api-version=$ApiVersion"
    $response = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $httpClient -Uri $testRunsUrl
    $testRunsResponse = ($response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)

    if (-not $testRunsResponse.value) {
        Write-Host "No test runs found for Build ID $BuildId. Exiting gracefully."
        Write-Host "##vso[task.setvariable variable=TestRunCount]0"
        Write-Host "##vso[task.complete result=Succeeded]"
        exit 0
    }

    Write-Host "Found $($testRunsResponse.value.Count) test runs."
    Write-Host "##vso[task.setvariable variable=TestRunCount]$($testRunsResponse.value.Count)"
    #endregion

    #region Process Results
    $allEntities = [System.Collections.Generic.List[object]]::new()

    foreach ($run in $testRunsResponse.value) {
        # It's common practice to skip aggregated runs as they don't contain raw result data.
        if ($run.name -like '*Aggregated*') {
            Write-Host "##vso[task.debug]Skipping aggregated run '$($run.name)' (ID: $($run.id))."
            continue
        }

        Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
        $continuationToken = $null
        $page = 1

        do {
            # Base URL for fetching results with all necessary details for analysis.
            $resultsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs/$($run.id)/results?`$top=1000&detailsToInclude=WorkItems,Iterations,SubResult,StackTrace&api-version=$ApiVersion"
            if ($continuationToken) {
                $resultsUrl += "&continuationToken=$([uri]::EscapeDataString($continuationToken))"
            }

            $resultsResponse = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $httpClient -Uri $resultsUrl
            $resultsData = ($resultsResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)
            $results = $resultsData.value

            Write-Host "Fetched page $page with $($results.Count) results for run $($run.id)."

            foreach ($result in $results) {
                # --- Data Modeling Best Practices ---
                # PartitionKey: Use the pipeline definition name. This groups all historical data for a pipeline together,
                # which is excellent for trend analysis. Fallback to a generic key if the info isn't present.
                $partitionKey = if (-not [string]::IsNullOrEmpty($run.pipelineReference.definition.name)) {
                    $run.pipelineReference.definition.name.Replace(" ", "_") # Replace spaces for cleaner keys
                }
                else {
                    "Build_$BuildId"
                }

                # RowKey: Use a reverse-chronological, unique key. This is a highly effective pattern.
                # It makes querying for the "latest result of a test" extremely fast as new data sorts to the top.
                $completedDate = if ($result.completedDate) { [DateTime]::Parse($result.completedDate, $null, 'RoundtripKind') } else { (Get-Date) }
                $reversedTicks = "{0:D19}" -f ([DateTime]::MaxValue.Ticks - $completedDate.ToUniversalTime().Ticks)
                $rowKey = "{0}_{1}_{2}_{3}" -f $reversedTicks, $result.testCase.id, $run.id, ($result.retryCount ?? 0)

                $entity = @{
                    PartitionKey      = $partitionKey
                    RowKey            = $rowKey
                    Timestamp         = $completedDate.ToUniversalTime() # Store the actual completion time
                    TestName          = $result.testCase.name ?? "UnknownTest"
                    TestCaseId        = $result.testCase.id ?? "Unknown"
                    Outcome           = $result.outcome ?? "Inconclusive"
                    BuildId           = $BuildId
                    BuildReason       = $env:BUILD_REASON ?? "Unknown"
                    RunId             = $run.id
                    TestSuite         = $run.name ?? "UnknownSuite"
                    DurationMs        = $result.durationInMs ?? 0
                    ErrorMessage      = $result.errorMessage # Can be null, which is fine
                    StackTrace        = $result.stackTrace   # Can be null
                    Attempt           = $result.retryCount ?? 0
                    AgentName         = $env:AGENT_NAME ?? "Unknown"
                    SourceBranch      = $env:BUILD_SOURCEBRANCHNAME ?? "Unknown"
                    PipelineDefId     = $run.pipelineReference.definition.id ?? 0
                }
                $allEntities.Add($entity)
            }

            # Check for the continuation token in the response headers to handle pagination.
            $continuationToken = $null
            if ($resultsResponse.Headers.Contains("x-ms-continuationtoken")) {
                $continuationToken = $resultsResponse.Headers.GetValues("x-ms-continuationtoken") | Select-Object -First 1
                Write-Host "##vso[task.debug]Continuation token found for page $page. More results to fetch."
            }
            $page++
        } while ($continuationToken)
    }
    #endregion

    #region Batch Upload
    if ($allEntities.Count -gt 0) {
        Write-Host "Total test result entities to upload: $($allEntities.Count)."
        Write-Host "##vso[task.setvariable variable=EntityCount]$($allEntities.Count)"

        # CRITICAL: Group entities by PartitionKey. Batch operations in Azure Table Storage
        # require all entities in the batch to have the same PartitionKey.
        $entityGroups = $allEntities | Group-Object PartitionKey

        Write-Host "Uploading entities in $($entityGroups.Count) partition groups..."

        foreach ($group in $entityGroups) {
            $partitionEntities = $group.Group
            $partitionName = $group.Name
            Write-Host "Processing partition '$partitionName' with $($partitionEntities.Count) entities."

            $batchCount = [math]::Ceiling($partitionEntities.Count / $BatchSize)
            for ($i = 0; $i -lt $batchCount; $i++) {
                $batch = $partitionEntities | Select-Object -Skip ($i * $BatchSize) -First $BatchSize
                $batchNum = $i + 1
                Write-Host "Uploading batch $batchNum of $batchCount for partition '$partitionName'..."

                try {
                    # The AzTable module handles the batch creation internally when passed an array of entities.
                    Add-AzTableRow -Table $cloudTable -Entity $batch -ErrorAction Stop
                }
                catch {
                    # Fallback Logic: If the batch fails for any reason, try uploading entities one by one.
                    Write-Host "##vso[task.logissue type=warning]Batch $batchNum for partition '$partitionName' failed: $($_.Exception.Message). Attempting individual uploads for this batch."
                    foreach ($entity in $batch) {
                        try {
                            Add-AzTableRow -Table $cloudTable -PartitionKey $entity.PartitionKey -RowKey $entity.RowKey -Property $entity -ErrorAction Stop
                        }
                        catch {
                            Write-Host "##vso[task.logissue type=error]Failed to upload individual entity with RowKey '$($entity.RowKey)' in partition '$partitionName': $($_.Exception.Message)"
                        }
                    }
                }
            }
        }
    }
    else {
        Write-Host "No test results were found to log."
        Write-Host "##vso[task.setvariable variable=EntityCount]0"
    }
    #endregion

    $startTime.Stop()
    $durationMs = $startTime.Elapsed.TotalMilliseconds
    Write-Host "##vso[task.setvariable variable=ScriptDurationMs]$durationMs"
    Write-Host "Script completed successfully in $($startTime.Elapsed.TotalSeconds) seconds."
    Write-Host "##vso[task.complete result=Succeeded]"
}
catch {
    Write-Host "##vso[task.logissue type=error;]A critical error occurred: $($_.Exception.Message)"
    Write-Host "##vso[task.logissue type=error;]$($_.ScriptStackTrace)"
    Write-Host "##vso[task.complete result=Failed]"
    exit 1
}
finally {
    # Ensure the HttpClient is always disposed of to release resources.
    if ($null -ne $httpClient) {
        Write-Host "##vso[task.debug]Disposing HttpClient."
        $httpClient.Dispose()
    }
}