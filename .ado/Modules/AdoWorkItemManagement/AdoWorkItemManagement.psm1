<#
.SYNOPSIS
    A PowerShell module for managing Azure DevOps work items, specifically for test health automation.
.DESCRIPTION
    Provides resilient, asynchronous functions to query, create, and update work items (Bugs/Tasks) in Azure Boards.
.NOTES
    Version: 2.1
    Author: Staff SDET
    Changes in v2.1:
    - Fixed syntax error in `New-AdoBugForFlakyTest` when building the JSON body.
    - Ensured the generic `Invoke-AdoRestMethodAsyncWithRetry` helper is present and correct.
#>

#region Reusable Functions

function Get-AdoWorkItemsByTag {
    <#
    .SYNOPSIS
        Asynchronously fetches work items from Azure Boards that contain a specific tag.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Http.HttpClient]$HttpClient,
        [Parameter(Mandatory = $true)]
        [string]$Organization,
        [Parameter(Mandatory = $true)]
        [string]$Project,
        [Parameter(Mandatory = $true)]
        [string]$Tag,
        [Parameter(Mandatory = $true)]
        [string]$ApiVersion
    )
    $encodedProject = [uri]::EscapeDataString($Project)
    $wiql = @{
        query = "SELECT [System.Id], [System.Title], [System.State], [System.Tags] FROM workitems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS '$Tag' AND [System.State] <> 'Removed'"
    } | ConvertTo-Json

    $url = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/wiql?api-version=$ApiVersion"
    $wiqlResponse = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $HttpClient -Uri $url -Method Post -Body $wiql
    $wiqlData = ($wiqlResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)

    if ($wiqlData.workItems) {
        $ids = ($wiqlData.workItems.id | ForEach-Object { $_ }) -join ','
        if ([string]::IsNullOrEmpty($ids)) { return @() }
        
        $getDetailsUrl = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/workitems?ids=$ids&`$expand=fields&api-version=$ApiVersion"
        $detailsResponse = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $HttpClient -Uri $getDetailsUrl
        return ($detailsResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json).value
    }
    return @()
}

function New-AdoBugForFlakyTest {
    <#
    .SYNOPSIS
        Creates a new Bug (or Task as a fallback) work item for a flaky test.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Http.HttpClient]$HttpClient,
        [Parameter(Mandatory = $true)]
        [string]$Organization,
        [Parameter(Mandatory = $true)]
        [string]$Project,
        [Parameter(Mandatory = $true)]
        [string]$TestName,
        [Parameter(Mandatory = $true)]
        [string]$Description,
        [Parameter(Mandatory = $true)]
        [string]$AreaPath,
        [Parameter(Mandatory = $true)]
        [string]$Tags,
        [Parameter(Mandatory = $true)]
        [string]$ApiVersion,
        [string]$AssignedToEmail,
        [string]$WorkItemType = 'Task'  # NOTE: This should be 'Bug' in enterprize environment. 
    )
    $encodedProject = [uri]::EscapeDataString($Project)
    $url = "https://dev.azure.com/$Organization/$encodedProject/_apis/wit/workitems/`$$WorkItemType`?api-version=$ApiVersion"
    
    # Use a list to build the JSON patch payload correctly.
    $bodyPayload = [System.Collections.Generic.List[object]]::new()
    $bodyPayload.Add(@{ op = "add"; path = "/fields/System.Title"; value = "[Flaky Test] $TestName" })
        # TODO: Use Microsoft.VSTS.TCM.ReproSteps when work item is BUG
    #@{ op = "add"; path = "/fields/Microsoft.VSTS.TCM.ReproSteps"; value = $description },
    $bodyPayload.Add(@{ op = "add"; path = "/fields/System.Description"; value = $Description })
    $bodyPayload.Add(@{ op = "add"; path = "/fields/System.AreaPath"; value = $AreaPath })
    $bodyPayload.Add(@{ op = "add"; path = "/fields/System.Tags"; value = $Tags })
    $bodyPayload.Add(@{ op = "add"; path = "/fields/Microsoft.VSTS.Common.Priority"; value = 2 })

    # Add assignment if an email is provided and is not the default "N/A"
    if (-not [string]::IsNullOrEmpty($AssignedToEmail) -and $AssignedToEmail -ne "N/A") {
        Write-Host "Attempting to assign bug to '$AssignedToEmail'"
        $bodyPayload.Add(@{ op = "add"; path = "/fields/System.AssignedTo"; value = $AssignedToEmail })
    }
    
    $body = $bodyPayload | ConvertTo-Json -Depth 5

    $response = Invoke-AdoRestMethodAsyncWithRetry -HttpClient $HttpClient -Uri $url -Method Patch -Body $body -ContentType "application/json-patch+json"
    return ($response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)
}

function Update-AdoBugState {
    <#
    .SYNOPSIS
        Updates the state of an existing work item and adds a history comment.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Http.HttpClient]$HttpClient,
        [Parameter(Mandatory = $true)]
        [string]$Organization,
        [Parameter(Mandatory = $true)]
        [int]$BugId,
        [Parameter(Mandatory = $true)]
        [string]$State,
        [Parameter(Mandatory = $true)]
        [string]$Comment,
        [Parameter(Mandatory = $true)]
        [string]$ApiVersion,
        [string]$Tags
    )
    $url = "https://dev.azure.com/$Organization/_apis/wit/workitems/$BugId`?api-version=$ApiVersion"
    $bodyPayload = [System.Collections.Generic.List[object]]::new()
    $bodyPayload.Add(@{ op = "add"; path = "/fields/System.State"; value = $State })
    $bodyPayload.Add(@{ op = "add"; path = "/fields/System.History"; value = $Comment })
    if ($Tags) {
        $bodyPayload.Add(@{ op = "add"; path = "/fields/System.Tags"; value = $Tags })
    }
    
    Invoke-AdoRestMethodAsyncWithRetry -HttpClient $HttpClient -Uri $url -Method Patch -Body ($bodyPayload | ConvertTo-Json) -ContentType "application/json-patch+json" | Out-Null
}

function Invoke-AdoRestMethodAsyncWithRetry {
    <#
    .SYNOPSIS
        Performs a resilient request to a REST API, supporting different methods and retry logic.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [System.Net.Http.HttpClient]$HttpClient,
        [Parameter(Mandatory = $true)]
        [string]$Uri,
        [string]$Method = 'GET',
        [string]$Body,
        [string]$ContentType = "application/json",
        [int]$MaxRetries = 3,
        [int]$RetryDelaySec = 5
    )

    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        try {
            Write-Host "##vso[task.debug]Attempting to $Method : $Uri (Attempt $attempt of $MaxRetries)"
            $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::$Method, $Uri)
            if ($Body) {
                $request.Content = [System.Net.Http.StringContent]::new($Body, [System.Text.Encoding]::UTF8, $ContentType)
            }

            $response = $HttpClient.SendAsync($request).GetAwaiter().GetResult()

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

Export-ModuleMember -Function *
