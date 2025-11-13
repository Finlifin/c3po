#!/usr/bin/env pwsh
# Authentication API tests (PowerShell)

param()

$Script:ScriptDir = Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent
if (-not (Get-Command log_info -ErrorAction SilentlyContinue)) {
    . (Join-Path $Script:ScriptDir "lib.ps1")
}

function test_auth_login {
    log_info "Testing POST /api/v1/auth/login"

    $payload = ('{{"identifier":"{0}","password":"{1}"}}' -f $Script:AdminUsername, $Script:AdminPassword)
    $response = http_post "/auth/login" $payload

    $body = $response.Body
    $status = [string]$response.StatusCode

    log_info "Request: POST $(Get-FullApiUrl "/auth/login")"
    log_info "Payload: $payload"
    log_info "Response body: $body"
    log_info "Response status: $status"

    if (-not (assert_status "200" $status "Login request")) {
        return $false
    }

    if (-not (assert_json_field $body "accessToken" "Login response has accessToken")) {
        return $false
    }

    if (-not (assert_json_field $body "tokenType" "Login response has tokenType")) {
        return $false
    }

    save_token $body | Out-Null
    return $true
}

function test_auth_me {
    log_info "Testing GET /api/v1/auth/me"

    $response = http_get "/auth/me"
    $body = $response.Body
    $status = [string]$response.StatusCode

    log_info "Response body: $body"
    log_info "Response status: $status"

    if (-not (assert_status "200" $status "Get profile request")) {
        return $false
    }

    if (-not (assert_json_field $body "username" "Profile has username")) {
        return $false
    }

    if (-not (assert_json_field $body "role" "Profile has role")) {
        return $false
    }

    return $true
}

function test_auth_invalid_credentials {
    log_info "Testing login with invalid credentials"

    $payload = '{"identifier":"admin","password":"wrongpassword"}'
    $response = http_post "/auth/login" $payload
    $status = [string]$response.StatusCode

    log_info "Response status: $status"
    assert_status "401" $status "Invalid credentials should return 401" | Out-Null
}

function run_auth_tests {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor White
    Write-Host "Authentication Tests" -ForegroundColor White
    Write-Host "==================================" -ForegroundColor White

    clear_token

    test_auth_login | Out-Null
    test_auth_me | Out-Null
    test_auth_invalid_credentials | Out-Null

    Write-Host ""
}


