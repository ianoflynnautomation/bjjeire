<#
.SYNOPSIS
    Queries Azure DevOps for quarantined tests and generates a VSTest filter to exclude them.
.DESCRIPTION
    This script is designed to run in a CI/PR pipeline before the main test task.
    It finds all active work items tagged as 'FlakyTest' and 'Quarantined', extracts the
    fully qualified test names from their titles, and builds a filter string.
    This filter string is then set as an output variable ('quarantineFilter') to be consumed
    by a subsequent VSTest or 'dotnet test' task.
.OUTPUTS
    Sets a pipeline output variable named 'quarantineFilter'.
    Example value: "FullyQualifiedName!=Namespace.Class1.TestA&FullyQualifiedName!=Namespace.Class2.TestB"
.NOTES
    Version: 1.0
    Author: Staff SDET
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

$headers = @{
  Authorization  = "Bearer $Pat"
  "Content-Type" = "application/json"
}

try {
  Write-Host "Querying for active, quarantined flaky tests..."

  # This WIQL query finds work items that are active and have BOTH tags.
  # This is the source of truth for what is currently under quarantine.
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
  $response = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $wiql

  if (-not $response.workItems) {
    Write-Host "No quarantined tests found. All tests will be run."
    # Set an empty filter string. This is important.
    Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true]"
    exit 0
  }

  $testNamesToExclude = [System.Collections.Generic.List[string]]::new()
  $titlePrefix = '[Flaky Test] '

  Write-Host "Found $($response.workItems.Count) quarantined tests. Building exclusion filter."

  foreach ($item in $response.workItems) {
    # The work item URL is available directly from the WIQL response
    $workItemUrl = $item.url
    $workItemDetails = Invoke-RestMethod -Method Get -Uri $workItemUrl -Headers $headers
    $title = $workItemDetails.fields.'System.Title'

    if ($title -like "$($titlePrefix)*") {
      # Extract the fully qualified test name by removing the prefix
      $testName = $title.Substring($titlePrefix.Length)
      $testNamesToExclude.Add($testName.Trim())
      Write-Host "  - Adding to exclusion list: $testName"
    }
  }

  if ($testNamesToExclude.Count -eq 0) {
    Write-Host "No valid test names found in work item titles. All tests will be run."
    Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true]"
    exit 0
  }

  # Build the final filter string for VSTest/dotnet test
  # Format: FullyQualifiedName!=Test1&FullyQualifiedName!=Test2
  $filterParts = $testNamesToExclude | ForEach-Object { "FullyQualifiedName!=$_" }
  $filterString = $filterParts -join '&'

  Write-Host "Generated VSTest filter: $filterString"

  # Set the output variable for the pipeline. The next task can access this.
  Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true]$filterString"

  Write-Host "Script completed successfully."

}
catch {
  Write-Error "A critical error occurred while generating the quarantine filter: $_"
  Write-Error $_.Exception.ToString()
  # In case of failure, set an empty filter to avoid breaking the build.
  Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true]"
  exit 1
}
