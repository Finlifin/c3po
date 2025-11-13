#!/usr/bin/env pwsh
# Dashboard API tests (PowerShell)

param()

$Script:ScriptDir = Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent
if (-not (Get-Command log_info -ErrorAction SilentlyContinue)) {
    . (Join-Path $Script:ScriptDir "lib.ps1")
}

function test_dashboard_overview {
    log_info "Testing GET /api/v1/dashboard/overview"

    $response = http_get "/dashboard/overview"
    $body = $response.Body
    $status = [string]$response.StatusCode

    log_info "Response body: $body"
    log_info "Response status: $status"

    if (-not (assert_status "200" $status "Dashboard overview request")) {
        return $false
    }

    if (-not (assert_json_field $body "totalMembers" "Dashboard has totalMembers")) {
        return $false
    }

    if (-not (assert_json_field $body "activeMembers" "Dashboard has activeMembers")) {
        return $false
    }

    if (-not (assert_json_field $body "totalActivities" "Dashboard has totalActivities")) {
        return $false
    }

    return $true
}

function run_dashboard_tests {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor White
    Write-Host "Dashboard Tests" -ForegroundColor White
    Write-Host "==================================" -ForegroundColor White

    test_dashboard_overview | Out-Null

    Write-Host ""
}


