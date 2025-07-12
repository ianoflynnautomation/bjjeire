<#
.SYNOPSIS
    A foundational PowerShell module providing core, reusable functions for automation.
.DESCRIPTION
    This module includes resilient HTTP request clients, authentication helpers for Azure services,
    and other utilities required by higher-level automation modules.
.NOTES
    Version: 1.0
    Author:
#>

function New-AdoHttpClient {
  <#
    .SYNOPSIS
        Creates and configures a new System.Net.Http.HttpClient with an authorization header.
    #>
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][string]$AccessToken,
    [string]$AuthScheme = 'Bearer'
  )
  Add-Type -AssemblyName System.Net.Http
  $httpClient = [System.Net.Http.HttpClient]::new()
  $httpClient.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new($AuthScheme, $AccessToken)
  return $httpClient
}

function Get-AdxAccessToken {
  <#
    .SYNOPSIS
        Gets an authenticated access token for Azure Data Explorer using a Service Principal.
    #>
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][string]$KustoClusterUri,
    [Parameter(Mandatory = $true)][string]$AppClientId,
    [Parameter(Mandatory = $true)][string]$AppClientSecret,
    [Parameter(Mandatory = $true)][string]$TenantId
  )
  try {
    Write-Host "Requesting ADX access token for App ID '$AppClientId'..."
    $authUrl = "https://login.microsoftonline.com/$TenantId/oauth2/token"
    $authBody = "grant_type=client_credentials&client_id=$AppClientId&client_secret=$AppClientSecret&resource=$KustoClusterUri"
    $tokenResponse = Invoke-RestMethod -Uri $authUrl -Method Post -Body $authBody -ContentType 'application/x-www-form-urlencoded'
    Write-Host "Successfully obtained ADX access token."
    return $tokenResponse.access_token
  }
  catch {
    throw "Failed to acquire ADX access token. Error: $($_.Exception.Message)"
  }
}

function Invoke-ResilientRestMethod {
  <#
    .SYNOPSIS
        Performs a resilient HTTP request with automatic retries on transient failures.
    #>
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Net.Http.HttpClient]$HttpClient,
    [Parameter(Mandatory = $true)][string]$Uri,
    [string]$Method = 'GET',
    [object]$Body,
    [string]$ContentType = "application/json",
    [hashtable]$Headers,
    [int]$MaxRetries = 3,
    [int]$RetryDelaySec = 5
  )

  for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
    try {
      Write-Host "##vso[task.debug]API Call ($Method): $Uri (Attempt $attempt of $MaxRetries)"
      $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::$Method, $Uri)
            
      # Set Body and Content-Type
      if ($Body) {
        if ($Body -is [byte[]]) {
          $request.Content = [System.Net.Http.ByteArrayContent]::new($Body)
        }
        else {
          $request.Content = [System.Net.Http.StringContent]::new($Body, [System.Text.Encoding]::UTF8, $ContentType)
        }
        $request.Content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new($ContentType)
      }

      # Add custom headers
      if ($Headers) {
        foreach ($key in $Headers.Keys) {
          # Content-specific headers must be added to the content object itself
          if ($request.Content -and $key -match 'Content-') {
            $request.Content.Headers.Add($key, $Headers[$key])
          }
          else {
            # Regular request headers
            $request.Headers.Add($key, $Headers[$key])
          }
        }
      }

      $response = $HttpClient.SendAsync($request).GetAwaiter().GetResult()

      if ($response.IsSuccessStatusCode) {
        return $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json -ErrorAction SilentlyContinue
      }

      $errorContent = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      $errorMessage = "API call failed with status '$($response.StatusCode)'. Response: $errorContent"
      if ($response.StatusCode -lt 500) { throw $errorMessage }
      Write-Warning $errorMessage
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
      throw "Failed to execute API call to '$Uri' after $MaxRetries attempts."
    }
  }
}

Export-ModuleMember -Function New-AdoHttpClient, Get-AdxAccessToken, Invoke-ResilientRestMethod