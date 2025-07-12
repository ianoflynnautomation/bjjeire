<#
.SYNOPSIS
    A module for managing Azure DevOps work items for test health automation.
.DESCRIPTION
    Provides functions to query, create, and update Bugs in Azure Boards based on test analysis.
    Depends on AdoAutomationCore.psm1 for all API interactions.
.NOTES
    Version: 1.0
    Author:
#>
using module "..\AdoAutomationCore\AdoAutomationCore.psm1"

function Get-AdoWorkItemsByTag {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][string]$Tag,
    [Parameter(Mandatory = $true)][string]$ApiVersion
  )
  $wiql = @{
    query = "SELECT [System.Id], [System.Title], [System.State], [System.Tags] FROM workitems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS '$Tag' AND [System.State] <> 'Removed'"
  } | ConvertTo-Json

  $url = "https://dev.azure.com/$Organization/$Project/_apis/wit/wiql?api-version=$ApiVersion"
  $wiqlResponse = Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url -Method Post -Body $wiql

  if ($wiqlResponse.workItems) {
    $ids = ($wiqlResponse.workItems.id) -join ','
    if ([string]::IsNullOrEmpty($ids)) { return @() }
        
    $getDetailsUrl = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems?ids=$ids&`$expand=fields&api-version=$ApiVersion"
    return (Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $getDetailsUrl).value
  }
  return @()
}

function New-AdoBugForFlakyTest {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][string]$TestName,
    [Parameter(Mandatory = $true)][string]$Description,
    [Parameter(Mandatory = $true)][string]$AreaPath,
    [Parameter(Mandatory = $true)][string]$Tags,
    [Parameter(Mandatory = $true)][string]$ApiVersion,
    [string]$AssignedToEmail,
    [ValidateSet('Bug', 'Task')][string]$WorkItemType = 'Bug'
  )
  $url = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems/`$$WorkItemType`?api-version=$ApiVersion"
    
  $body = [System.Collections.Generic.List[object]]::new()
  $body.Add(@{ op = "add"; path = "/fields/System.Title"; value = "[Flaky Test] $TestName" })
  # Use the correct field based on the Work Item Type
  $descriptionField = if ($WorkItemType -eq 'Bug') { "Microsoft.VSTS.TCM.ReproSteps" } else { "System.Description" }
  $body.Add(@{ op = "add"; path = "/fields/$descriptionField"; value = $Description })
  $body.Add(@{ op = "add"; path = "/fields/System.AreaPath"; value = $AreaPath })
  $body.Add(@{ op = "add"; path = "/fields/System.Tags"; value = $Tags })
  $body.Add(@{ op = "add"; path = "/fields/Microsoft.VSTS.Common.Priority"; value = 2 })

  if ($AssignedToEmail -and $AssignedToEmail -ne "N/A") {
    $body.Add(@{ op = "add"; path = "/fields/System.AssignedTo"; value = $AssignedToEmail })
  }
    
  Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url -Method Patch -Body ($body | ConvertTo-Json -Depth 5) -ContentType "application/json-patch+json"
}

function Update-AdoWorkItemState {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = $true)][int]$WorkItemId,
    [Parameter(Mandatory = $true)][string]$State,
    [Parameter(Mandatory = $true)][string]$Comment,
    [string]$Tags,
    [Parameter(Mandatory = $true)][string]$ApiVersion
  )
  $url = "https://dev.azure.com/$Organization/_apis/wit/workitems/$WorkItemId`?api-version=$ApiVersion"
  $body = [System.Collections.Generic.List[object]]::new()
  $body.Add(@{ op = "add"; path = "/fields/System.State"; value = $State })
  $body.Add(@{ op = "add"; path = "/fields/System.History"; value = $Comment })
  if ($Tags) {
    $body.Add(@{ op = "add"; path = "/fields/System.Tags"; value = $Tags })
  }
    
  Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url -Method Patch -Body ($body | ConvertTo-Json) -ContentType "application/json-patch+json"
}

function Get-AdoWorkItemsByWiql {
  <#
    .SYNOPSIS
        Executes a WIQL query and returns the full details of the resulting work items.
    #>
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][string]$Query,
    [Parameter(Mandatory = $true)][string]$ApiVersion
  )
  $wiqlPayload = @{ query = $Query } | ConvertTo-Json
  $wiqlUrl = "https://dev.azure.com/$Organization/$Project/_apis/wit/wiql?api-version=$ApiVersion"
  $wiqlResponse = Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $wiqlUrl -Method Post -Body $wiqlPayload

  if ($wiqlResponse.workItems) {
    $ids = ($wiqlResponse.workItems.id) -join ','
    if ([string]::IsNullOrEmpty($ids)) { return @() }
        
    $getDetailsUrl = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems?ids=$ids&`$expand=fields&api-version=$ApiVersion"
    return (Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $getDetailsUrl).value
  }
  return @()
}

Export-ModuleMember -Function Get-AdoWorkItemsByTag, New-AdoBugForFlakyTest, Update-AdoWorkItemState, Get-AdoWorkItemsByWiql