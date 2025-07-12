<#
.SYNOPSIS
    Queries Azure DevOps for quarantined tests and combines them with a base filter to generate a final VSTest filter.
.DESCRIPTION
    This script finds all active work items tagged 'FlakyTest' and 'Quarantined', builds an exclusion filter,
    and prepends it to an optional base filter string. The result is set as a pipeline output variable.
.OUTPUTS
    Sets a pipeline output variable named 'finalTestFilter'.
.NOTES
    Version: 4.0
    Author:
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Organization,
  [Parameter(Mandatory = $true)][string]$Project,
  [Parameter(Mandatory = $true)][string]$Pat,
  [Parameter(Mandatory = $false)][string]$ApiVersion = '7.1',
  [Parameter(Mandatory = $false)][string]$BaseFilter
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

  $quarantineFilter = ''
  if ($quarantinedItems) {
    # 3. Build the VSTest Filter for Quarantined Tests
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

    if ($filterParts.Count -gt 0) {
      $quarantineFilter = $filterParts -join '&'
    }
  }
  else {
    Write-Host "No quarantined tests found."
  }

  # 4. Combine Filters
  Write-Host "Base filter: $BaseFilter"
  Write-Host "Quarantine filter: $quarantineFilter"
  
  $finalFilter = $BaseFilter
  if (-not [string]::IsNullOrEmpty($quarantineFilter)) {
    if (-not [string]::IsNullOrEmpty($finalFilter)) {
      $finalFilter += "&"
    }
    $finalFilter += $quarantineFilter
  }

  # 5. Set Final Pipeline Variable
  Write-Host "Final combined filter: $finalFilter"
  Write-Host "##vso[task.setvariable variable=finalTestFilter;isOutput=true]$finalFilter"

}
catch {
  Write-Host "##vso[task.logissue type=error]A critical error occurred while generating the quarantine filter: $($_.Exception.Message)"
  Write-Host "##vso[task.setvariable variable=finalTestFilter;isOutput=true]$($BaseFilter)"
  exit 1
}
finally {
  if ($null -ne $httpClient) {
    $httpClient.Dispose()
  }
  Write-Host "Script completed."
}