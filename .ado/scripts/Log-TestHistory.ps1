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

$headers = @{
  Authorization  = "Bearer $Pat"
  "Content-Type" = "application/json"
}

# Helper function for resilient API calls with retry logic
function Invoke-AdoRestMethodWithRetry {
    param(
        [string]$Uri,
        [string]$Method = 'GET',
        [hashtable]$Headers,
        [int]$MaxRetries = 3,
        [int]$RetryDelaySec = 5,
        [string]$ResponseHeadersVariable
    )
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $params = @{ Uri = $Uri; Method = $Method; Headers = $Headers; ErrorAction = 'Stop' }
            if ($ResponseHeadersVariable) { $params.Add('ResponseHeadersVariable', $ResponseHeadersVariable) }
            return Invoke-RestMethod @params
        }
        catch {
            Write-Warning "API call to '$Uri' failed on attempt $i. Error: $($_.Exception.Message)"
            if ($i -lt $MaxRetries) { Start-Sleep -Seconds ($RetryDelaySec * $i) }
            else { throw "Failed to call API after $MaxRetries attempts." }
        }
    }
}

try {
    Import-Module -Name Az.Storage -ErrorAction Stop
    Import-Module -Name Az.Resources -ErrorAction Stop
    Import-Module -Name AzTable -ErrorAction Stop

    $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString
    $tableRef = Get-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction SilentlyContinue
    if (-not $tableRef) {
        Write-Host "Table '$TableName' not found. Creating it..."
        $tableRef = New-AzStorageTable -Name $TableName -Context $storageContext
    }
    $cloudTable = $tableRef.CloudTable

    $allEntitiesToLog = [System.Collections.Generic.List[object]]::new()

    Write-Host "Fetching test runs for build '$BuildId'..."
    $testRunsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs?buildIds=$BuildId&includeRunDetails=true&api-version=$ApiVersion"
    $testRunsResponse = Invoke-AdoRestMethodWithRetry -Uri $testRunsUrl -Headers $headers
    
    if (-not $testRunsResponse.value) {
        Write-Warning "No test runs found for Build ID $BuildId."
        exit 0
    }

    foreach ($run in $testRunsResponse.value) {
        Write-Host "Processing Test Run '$($run.name)' (ID: $($run.id))..."
        $continuationToken = $null
        $page = 1
        do {
            $resultsUrl = "https://dev.azure.com/$Organization/$Project/_apis/test/runs/$($run.id)/results?`$top=1000&detailsToInclude=WorkItems,Iterations,SubResult,StackTrace&api-version=$ApiVersion"
            if ($continuationToken) { $resultsUrl += "&continuationToken=$([uri]::EscapeDataString($continuationToken))" }
            
            $response = Invoke-RestMethod -Uri $resultsUrl -Method Get -Headers $headers -ResponseHeadersVariable responseHeaders
            $results = $response.value
            Write-Host "Fetched page $page with $($results.Count) results."

            foreach ($result in $results) {
                # BEST PRACTICE: Use a deterministic PartitionKey based on the pipeline name.
                $partitionKey = if ($run.pipelineReference.definition.name) { $run.pipelineReference.definition.name } else { $run.build.name ?? "Uncategorized" }
                
                # BEST PRACTICE: Use a deterministic RowKey built from the data's natural unique identifiers.
                # This prevents duplicate entries if the script is re-run.
                $rowKey = "$($BuildId)_$($run.id)_$($result.id)"

                $entity = @{
                    PartitionKey      = $partitionKey
                    RowKey            = $rowKey
                    Timestamp         = (Get-Date).ToUniversalTime()
                    TestName          = $result.testCase.name ?? "UnknownTest"
                    TestCaseId        = $result.testCase.id
                    Outcome           = $result.outcome ?? "Inconclusive"
                    BuildId           = $BuildId
                    BuildReason       = $env:BUILD_REASON ?? "Unknown"
                    SourceBranch      = $env:BUILD_SOURCEBRANCHNAME ?? "Unknown"
                    AgentName         = $env:AGENT_NAME ?? "Unknown"
                    DurationMs        = $result.durationInMs ?? 0
                    TestSuite         = $run.name ?? "UnknownSuite"
                    BuildDefinitionId = $run.pipelineReference.definition.id
                    ErrorMessage      = $result.errorMessage
                    StackTrace        = $result.stackTrace
                }
                $allEntitiesToLog.Add($entity)
            }
            $continuationToken = $responseHeaders['x-ms-continuationtoken']
            $page++
        } while ($continuationToken)
    }

    if ($allEntitiesToLog.Count -gt 0) {
        Write-Host "Preparing to upsert (Insert or Replace) $($allEntitiesToLog.Count) test results..."
        
        $batchCount = [math]::Ceiling($allEntitiesToLog.Count / $BatchSize)
        for ($i = 0; $i -lt $batchCount; $i++) {
            $batch = $allEntitiesToLog | Select-Object -Skip ($i * $BatchSize) -First $BatchSize
            Write-Host "Upserting batch $($i+1) of $batchCount..."
            try {
                # BEST PRACTICE: Use Add-AzTableRow with -Force to perform an "Insert or Replace" (Upsert) operation.
                # This makes the entire process idempotent.
                Add-AzTableRow -Table $cloudTable -Entity $batch -Force -ErrorAction Stop
            }
            catch {
                Write-Warning "Batch $($i+1) failed. Error: $_. This can happen with mixed partition keys in a single batch. Trying individual upserts as a fallback..."
                foreach ($entity in $batch) {
                    try {
                        Add-AzTableRow -Table $cloudTable -PartitionKey $entity.PartitionKey -RowKey $entity.RowKey -Property $entity -Force -ErrorAction Stop
                    }
                    catch {
                        Write-Warning "Failed to upsert entity with RowKey '$($entity.RowKey)'. Error: $_"
                    }
                }
            }
        }
        Write-Host "Upsert complete."
    }
    else { Write-Host "No test results found to log." }

    Write-Host "Script completed successfully."
}
catch {
    Write-Error "A critical error occurred: $_"
    Write-Error $_.Exception.ToString()
    exit 1
}
