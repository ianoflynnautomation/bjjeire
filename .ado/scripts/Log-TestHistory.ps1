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
    Authorization = "Bearer $Pat"
    "Content-Type" = "application/json"
}

try {
    # FIX: Explicitly import both required modules.
    # Az.Storage is for table management (Get/New-AzStorageTable).
    # Az.Data.Tables is for data operations (Add-AzTableRow).
    Import-Module -Name Az.Storage -ErrorAction Stop
    Import-Module -Name Az.Data.Tables -ErrorAction Stop

    # --- Setup Azure Table Storage Connection using modern cmdlets ---
    Write-Host "Connecting to Azure Storage..."
    $storageContext = New-AzStorageContext -ConnectionString $StorageConnectionString

    Write-Host "Checking for table '$TableName'..."
    $table = Get-AzStorageTable -Name $TableName -Context $storageContext -ErrorAction SilentlyContinue
    if (-not $table) {
        Write-Host "Table not found. Creating table '$TableName'..."
        $table = New-AzStorageTable -Name $TableName -Context $storageContext
    }

    # --- Data Collection ---
    $allTestResultsForLogging = [System.Collections.Generic.List[object]]::new()

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
                # Create a PowerShell hashtable for the entity. This is the modern approach.
                # The keys of the hashtable become the columns in the table.
                $entity = @{
                    PartitionKey    = $run.pipelineReference.pipelineDefinition.name
                    RowKey          = "$($BuildId)_$($result.id)"
                    TestName        = $result.testCase.name
                    Outcome         = $result.outcome
                    BuildId         = $BuildId
                    Duration        = $result.durationInMs
                    TestSuite       = $run.name
                    BuildDefinition = $run.pipelineReference.pipelineDefinition.name
                    Timestamp       = Get-Date
                }
                $allTestResultsForLogging.Add($entity)
            }
            
            # Check for the continuation token to see if there's more data
            $continuationToken = $responseHeaders['x-ms-continuationtoken']
            $page++

        } while ($continuationToken)
    }

    # --- Data Ingestion ---
    # Note: For improved performance on very large datasets, this could be refactored
    # to use batch transactions instead of adding rows one-by-one.
    if ($allTestResultsForLogging.Count -gt 0) {
        Write-Host "Uploading $($allTestResultsForLogging.Count) test results..."
        foreach ($entity in $allTestResultsForLogging) {
            try {
                Add-AzTableRow -Table $table -Entity $entity -ErrorAction Stop
            }
            catch {
                Write-Warning "Failed to upload entity with RowKey '$($entity.RowKey)'. Error: $_"
            }
        }
        Write-Host "Upload complete."
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
