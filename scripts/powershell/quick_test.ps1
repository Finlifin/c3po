#!/usr/bin/env pwsh
# Quick diagnostic script for checking API connectivity (PowerShell)

param()

$apiBase = $env:C3PO_API_BASE_URL
if ([string]::IsNullOrWhiteSpace($apiBase)) {
    $apiBase = "http://localhost:8080"
}

function Write-Section {
    param([string]$Message)
    Write-Host $Message -ForegroundColor White
}

function Invoke-DiagnosticRequest {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Uri,
        [string]$Body
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers @{"Content-Type" = "application/json"} -Body $Body -TimeoutSec 10 -ErrorAction Stop
        return $response.RawContent
    }
    catch [System.Net.WebException] {
        $webResponse = $_.Exception.Response
        if ($null -ne $webResponse) {
            $reader = New-Object System.IO.StreamReader($webResponse.GetResponseStream())
            $content = $reader.ReadToEnd()
            $reader.Dispose()
            return ("Status: {0}`n{1}" -f [int]$webResponse.StatusCode, $content)
        }
        return $_.Exception.Message
    }
    catch {
        return $_.Exception.Message
    }
}

function Write-Preview {
    param([string]$Content, [int]$Lines = 50)
    $split = $Content -split "`r?`n"
    $preview = $split | Select-Object -First $Lines
    Write-Host ($preview -join [Environment]::NewLine)
}

Write-Section "=================================="
Write-Section "Quick Diagnostic Test"
Write-Section "=================================="
Write-Host ""

Write-Section "1. Testing server health..."
$healthResponse = Invoke-DiagnosticRequest -Method "GET" -Uri "$apiBase/actuator/health"
Write-Section "Health check response:"
Write-Preview -Content $healthResponse
Write-Host ""

Write-Section "2. Testing /api/v1/auth/login endpoint..."
Write-Section ("URL: {0}/api/v1/auth/login" -f $apiBase)
$loginPayload = '{"identifier":"admin","password":"admin123"}'
Write-Section ("Payload: {0}" -f $loginPayload)
Write-Host ""
Write-Section "Response:"
$loginResponse = Invoke-DiagnosticRequest -Method "POST" -Uri "$apiBase/api/v1/auth/login" -Body $loginPayload
Write-Preview -Content $loginResponse
Write-Host ""

Write-Section "3. Testing if /auth/login works (without /api/v1 prefix)..."
Write-Section ("URL: {0}/auth/login" -f $apiBase)
$loginAltResponse = Invoke-DiagnosticRequest -Method "POST" -Uri "$apiBase/auth/login" -Body $loginPayload
Write-Preview -Content $loginAltResponse
Write-Host ""

Write-Section "=================================="
Write-Section "Diagnostic Complete"
Write-Section "=================================="


