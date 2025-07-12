<#
.SYNOPSIS
    A module for managing Azure DevOps work items for test health automation.
.DESCRIPTION
    Provides functions to query, create, and update Bugs in Azure Boards based on test analysis.
    Depends on AdoAutomationCore.psm1 for all API interactions.
.NOTES
    Version: 1.2
    Author: Staff SDET
    Changes:
    - Temporarily commented out the 'CustomFields' parameter and related logic in New-AdoBugForFlakyTest
      and Update-AdoWorkItemState to support environments without custom fields.
#>
using module "..\AdoAutomationCore\AdoAutomationCore.psm1"

function Get-AdoWorkItemsByTag {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = $true)][string]$Project,
    [Parameter(Mandatory = $true)][string]$Tag,
    [Parameter(Mandatory = $true)][string]$ApiVersion,
    [Parameter(Mandatory = $false)][string]$Fields
  )

  $apiFields = if (-not [string]::IsNullOrEmpty($Fields)) { $Fields } else { "System.Id,System.Title,System.State,System.Tags,System.CreatedDate" }
  $wiqlFields = ($apiFields.Split(',') | ForEach-Object { "[{0}]" -f $_.Trim() }) -join ', '

  $wiql = @{
    query = "SELECT $wiqlFields FROM workitems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS '$Tag' AND [System.State] <> 'Removed'"
  } | ConvertTo-Json

  $url = "https://dev.azure.com/$Organization/$Project/_apis/wit/wiql?api-version=$ApiVersion"
  $wiqlResponse = Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url -Method Post -Body $wiql

  if ($wiqlResponse.workItems) {
    $ids = ($wiqlResponse.workItems.id) -join ','
    if ([string]::IsNullOrEmpty($ids)) { return @() }
        
    $getDetailsUrl = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems?ids=$ids&fields=$([uri]::EscapeDataString($apiFields))&api-version=$ApiVersion"
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
    # [hashtable]$CustomFields,
    [ValidateSet('Bug', 'Task')][string]$WorkItemType = 'Bug'
  )
  $url = "https://dev.azure.com/$Organization/$Project/_apis/wit/workitems/`$$WorkItemType`?api-version=$ApiVersion"
    
  $body = [System.Collections.Generic.List[object]]::new()
  $body.Add(@{ op = "add"; path = "/fields/System.Title"; value = "[Flaky Test] $TestName" })
  $descriptionField = if ($WorkItemType -eq 'Bug') { "Microsoft.VSTS.TCM.ReproSteps" } else { "System.Description" }
  $body.Add(@{ op = "add"; path = "/fields/$descriptionField"; value = $Description })
  $body.Add(@{ op = "add"; path = "/fields/System.AreaPath"; value = $AreaPath })
  $body.Add(@{ op = "add"; path = "/fields/System.Tags"; value = $Tags })
  $body.Add(@{ op = "add"; path = "/fields/Microsoft.VSTS.Common.Priority"; value = 2 })

  if ($AssignedToEmail -and $AssignedToEmail -ne "N/A") {
    $body.Add(@{ op = "add"; path = "/fields/System.AssignedTo"; value = $AssignedToEmail })
  }

  # if ($CustomFields) {
  #     foreach ($key in $CustomFields.Keys) {
  #         $body.Add(@{ op = "add"; path = "/fields/$key"; value = $CustomFields[$key] })
  #     }
  # }
    
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
    # [hashtable]$CustomFields,
    [Parameter(Mandatory = $true)][string]$ApiVersion
  )
  $url = "https://dev.azure.com/$Organization/_apis/wit/workitems/$WorkItemId`?api-version=$ApiVersion"
  $body = [System.Collections.Generic.List[object]]::new()
  $body.Add(@{ op = "add"; path = "/fields/System.State"; value = $State })
  $body.Add(@{ op = "add"; path = "/fields/System.History"; value = $Comment })
  if ($Tags) {
    $body.Add(@{ op = "add"; path = "/fields/System.Tags"; value = $Tags })
  }
  # if ($CustomFields) {
  #     foreach ($key in $CustomFields.Keys) {
  #         $body.Add(@{ op = "add"; path = "/fields/$key"; value = $CustomFields[$key] })
  #     }
  # }
    
  Invoke-ResilientRestMethod -HttpClient $HttpClient -Uri $url -Method Patch -Body ($body | ConvertTo-Json) -ContentType "application/json-patch+json"
}

function Get-AdoWorkItemsByWiql {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Organization,
    [Parameter(Mandatory = "true")][string]$Project,
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
