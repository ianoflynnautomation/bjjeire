<#
.SYNOPSIS
    Queries Azure DevOps for quarantined tests and generates a VSTest filter to exclude them.
.DESCRIPTION
    This script is designed to run in a CI/PR pipeline before the main test task.
    It uses the AdoWorkItemManagement module to find all active work items tagged as 'FlakyTest' and 'Quarantined',
    extracts the test names, and builds a filter string. This filter is set as a pipeline output variable.
.OUTPUTS
    Sets a pipeline output variable named 'quarantineFilter'.
    Example: "FullyQualifiedName!=Namespace.Class1.TestA&FullyQualifiedName!=Namespace.Class2.TestB"
.NOTES
    Version: 2.0
    Author: Staff SDET
    Depends on: AdoWorkItemManagement.psm1
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Organization,
  [Parameter(Mandatory = $true)]
  [string]$Project,
  [Parameter(Mandatory = $true)]
  [string]$Pat,
  [Parameter(Mandatory = $false)]
  [string]$ApiVersion = '7.1'
)

$httpClient = $null

try {

    Install-Module -Name Az.Accounts -Repository PSGallery -Force -AcceptLicense -Scope CurrentUser
    Install-Module -Name Az.Kusto -Repository PSGallery -Force -AcceptLicense -Scope CurrentUser

    # 1. Initialization
    $modulePath = Join-Path $PSScriptRoot "\modules\AdoWorkItemManagement\AdoWorkItemManagement.psm1"
    Write-Host "Importing module from: $modulePath"
    Import-Module -Name $modulePath -Force

    Write-Host "Initializing HttpClient..."
    Add-Type -AssemblyName System.Net.Http
    $httpClient = [System.Net.Http.HttpClient]::new()
    $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Pat)

    # 2. Query for Quarantined Work Items
    Write-Host "Querying for active, quarantined flaky tests..."
    # The Get-AdoWorkItemsByTag function is not sufficient here as we need a more complex query (two tags).
    # We will construct a specific WIQL query for this task.
    $wiql = @{
        query = "
            SELECT [System.Id], [System.Title]
            FROM workitems
            WHERE [System.TeamProject] = @project
            AND [System.Tags] CONTAINS 'FlakyTest'
            AND [System.Tags] CONTAINS 'Quarantined'
            AND [System.State] IN ('New', 'Active', 'To Do', 'Proposed')
        "
    } | ConvertTo-Json

    $url = "https://dev.azure.com/$Organization/$Project/_apis/wit/wiql?api-version=$ApiVersion"
    
    # Use the resilient async function from the module
    $responseMessage = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $httpClient -Uri $url -Method Post -Body $wiql
    $response = ($responseMessage.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)

    if (-not $response.workItems) {
        Write-Host "No quarantined tests found. All tests will be run."
        Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true;]"
        exit 0
    }

    # 3. Build the VSTest Filter
    $testNamesToExclude = [System.Collections.Generic.List[string]]::new()
    $titlePrefix = '[Flaky Test] '

    Write-Host "Found $($response.workItems.Count) quarantined tests. Building exclusion filter."

    # Fetch details for all found work items in a single batch call for efficiency
    $ids = ($response.workItems.id | ForEach-Object { $_ }) -join ','
    $getDetailsUrl = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems?ids=$ids&fields=System.Title&api-version=$ApiVersion"
    $detailsResponseMessage = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $httpClient -Uri $getDetailsUrl
    $workItemsDetails = ($detailsResponseMessage.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json).value

    foreach ($item in $workItemsDetails) {
        $title = $item.fields.'System.Title'
        if ($title -like "$($titlePrefix)*") {
            $testName = $title.Substring($titlePrefix.Length)
            $testNamesToExclude.Add($testName.Trim())
            Write-Host "  - Adding to exclusion list: $testName"
        }
    }

    if ($testNamesToExclude.Count -eq 0) {
        Write-Host "No valid test names found in work item titles. All tests will be run."
        Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true;]"
        exit 0
    }

    $filterParts = $testNamesToExclude | ForEach-Object { "FullyQualifiedName!=$_" }
    $filterString = $filterParts -join '&'

    # 4. Set Pipeline Variable
    Write-Host "Generated VSTest filter: $filterString"
    Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true]$filterString"
    Write-Host "Script completed successfully."
}
catch {
    Write-Host "##vso[task.logissue type=error]A critical error occurred while generating the quarantine filter: $_"
    Write-Host "##vso[task.logissue type=error]$($_.ScriptStackTrace)"
    # In case of failure, set an empty filter to avoid breaking the build.
    Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true;]"
    exit 1
}
finally {
    if ($null -ne $httpClient) {
        $httpClient.Dispose()
    }
}
