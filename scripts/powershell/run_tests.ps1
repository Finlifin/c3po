#!/usr/bin/env pwsh
# Main entrypoint for PowerShell-based API regression tests

param()

$Script:ScriptDir = Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent
. (Join-Path $Script:ScriptDir "lib.ps1")

function Test-Dependencies {
    if (-not (Get-Command Invoke-WebRequest -ErrorAction SilentlyContinue)) {
        log_error "Invoke-WebRequest is not available"
        return $false
    }

    if (-not (Get-Command ConvertFrom-Json -ErrorAction SilentlyContinue)) {
        log_error "ConvertFrom-Json is not available"
        return $false
    }

    return $true
}

function Test-Server {
    log_info "Checking if API server is running at $Script:ApiBaseUrl"

    try {
        $response = Invoke-WebRequest -Uri (Get-FullApiUrl "/auth/login") -Method "GET" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            log_success "Server is running (HTTP $($response.StatusCode))"
            return $true
        }
    }
    catch [System.Net.WebException] {
        $webResponse = $_.Exception.Response
        if ($null -ne $webResponse) {
            $status = [int]$webResponse.StatusCode
            if ($status -ge 200 -and $status -lt 500) {
                log_success "Server is running (HTTP $status)"
                return $true
            }
            log_error "Server is not reachable (HTTP $status)"
            log_info "Please start the server with: cd c3po && ./gradlew bootRun"
            return $false
        }
    }
    catch {
        log_error "Server is not reachable"
        log_info "Please start the server with: cd c3po && ./gradlew bootRun"
        return $false
    }

    log_error "Server is not reachable"
    log_info "Please start the server with: cd c3po && ./gradlew bootRun"
    return $false
}

function Invoke-Main {
    Write-Host "==================================" -ForegroundColor White
    Write-Host "C3PO API Test Suite" -ForegroundColor White
    Write-Host "==================================" -ForegroundColor White
    Write-Host ("Base URL: {0}" -f $Script:ApiBaseUrl) -ForegroundColor White
    Write-Host ("Admin User: {0}" -f $Script:AdminUsername) -ForegroundColor White
    Write-Host "" -ForegroundColor White

    if (-not (Test-Dependencies)) {
        exit 1
    }

    clear_token

    log_info "Skipping server health check, starting tests..."

    . (Join-Path $Script:ScriptDir "test_auth.ps1")
    run_auth_tests

    if (Test-Path -LiteralPath $Script:TokenFile) {
        . (Join-Path $Script:ScriptDir "test_dashboard.ps1")
        run_dashboard_tests

        . (Join-Path $Script:ScriptDir "test_members.ps1")
        run_members_tests

        . (Join-Path $Script:ScriptDir "test_activities.ps1")
        run_activities_tests

        . (Join-Path $Script:ScriptDir "test_admin_users.ps1")
        run_admin_users_tests

        . (Join-Path $Script:ScriptDir "test_course_content.ps1")
        run_course_content_tests
    }
    else {
        log_error "Authentication failed, skipping other tests"
    }

    $success = print_summary
    clear_token

    if ($success) {
        exit 0
    }

    exit 1
}

Invoke-Main


