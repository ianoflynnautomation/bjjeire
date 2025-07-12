<#
.SYNOPSIS
    Queries Azure DevOps for quarantined tests and generates a VSTest filter to exclude them.
.DESCRIPTION
    This script is designed to run in a CI/PR pipeline before the main test task. It finds all active
    work items tagged 'FlakyTest' and 'Quarantined' and builds a VSTest filter string, which is
    set as a pipeline output variable named 'quarantineFilter'.
.NOTES
    Version: 3.0
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

$httpClient = $null

try {
  # 1. Initialization
  Write-Host "Initializing modules and HTTP client..."
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoAutomationCore\AdoAutomationCore.psm1") -Force
  Import-Module (Join-Path $PSScriptRoot "..\Modules\AdoWorkItemManagement\AdoWorkItemManagement.psm1") -Force
  $httpClient = New-AdoHttpClient -AccessToken $Pat

  # 2. Query for Quarantined Work Items
  Write-Host "Querying for active, quarantined flaky tests..."
  $wiqlQuery = "SELECT [System.Id], [System.Title] FROM workitems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS 'FlakyTest' AND [System.Tags] CONTAINS 'Quarantined' AND [System.State] IN ('New', 'Active', 'To Do', 'Proposed')"
    
  $quarantinedItems = Get-AdoWorkItemsByWiql -HttpClient $httpClient -Organization $Organization -Project $Project -Query $wiqlQuery -ApiVersion $ApiVersion

  if (-not $quarantinedItems) {
    Write-Host "No quarantined tests found. All tests will be run."
    Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true;]"
    exit 0
  }

  # 3. Build the VSTest Filter
  Write-Host "Found $($quarantinedItems.Count) quarantined tests. Building exclusion filter."
  $titlePrefix = '[Flaky Test] '
  $filterParts = $quarantinedItems | ForEach-Object {
    $title = $_.fields.'System.Title'
    if ($title -like "$titlePrefix*") {
      $testName = $title.Substring($titlePrefix.Length).Trim()
      Write-Host "  - Adding to exclusion list: $testName"
      "FullyQualifiedName!=$testName"
    }
  } | Where-Object { $_ }

  if ($filterParts.Count -eq 0) {
    Write-Host "No valid test names found in work item titles. All tests will be run."
    Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true;]"
    exit 0
  }

  $filterString = $filterParts -join '&'

  # 4. Set Pipeline Variable
  Write-Host "Generated VSTest filter: $filterString"
  Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true]$filterString"
}
catch {
  Write-Host "##vso[task.logissue type=error]A critical error occurred while generating the quarantine filter: $($_.Exception.Message)"
  Write-Host "##vso[task.setvariable variable=quarantineFilter;isOutput=true;]"
  exit 1
}
finally {
  if ($null -ne $httpClient) {
    $httpClient.Dispose()
  }
  Write-Host "Script completed."
}