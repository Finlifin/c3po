#!/usr/bin/env pwsh
# Members API tests (PowerShell)

param()

$Script:ScriptDir = Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent
if (-not (Get-Command log_info -ErrorAction SilentlyContinue)) {
    . (Join-Path $Script:ScriptDir "lib.ps1")
}

$Script:CreatedMemberId = ""

function test_members_create {
    log_info "Testing POST /api/v1/members"

    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $payload = ('{{"name":"Test Member {0}","studentId":"S{0}","major":"Computer Science","joinDate":"2024-01-01","status":"active","role":"member","email":"test{0}@example.com","phone":"1234567890"}}' -f $timestamp)

    $response = http_post "/members" $payload
    $body = $response.Body
    $status = [string]$response.StatusCode

    log_info "Response body: $body"
    log_info "Response status: $status"

    if (-not (assert_status "200" $status "Create member request")) {
        return $false
    }

    if (-not (assert_json_field $body "id" "Member response has id")) {
        return $false
    }

    try {
        $Script:CreatedMemberId = (Get-JsonFieldValue -JsonObject ($body | ConvertFrom-Json) -FieldPath "id")
    }
    catch {
        $Script:CreatedMemberId = $null
    }

    if ([string]::IsNullOrWhiteSpace($Script:CreatedMemberId)) {
        log_warn "Could not determine member ID from response"
    }
    else {
        log_info "Created member ID: $Script:CreatedMemberId"
    }

    return $true
}

function test_members_list {
    log_info "Testing GET /api/v1/members"

    $response = http_get "/members?page=1&limit=20"
    $status = [string]$response.StatusCode
    $body = $response.Body

    log_info "Response status: $status"

    if (-not (assert_status "200" $status "List members request")) {
        return $false
    }

    if (-not (assert_json_field $body "items" "Members response has items")) {
        return $false
    }

    return $true
}

function test_members_get {
    if ([string]::IsNullOrWhiteSpace($Script:CreatedMemberId)) {
        log_warn "Skipping GET member test (no member created)"
        return $true
    }

    log_info "Testing GET /api/v1/members/$Script:CreatedMemberId"

    $response = http_get "/members/$Script:CreatedMemberId"
    $status = [string]$response.StatusCode
    $body = $response.Body

    log_info "Response status: $status"

    if (-not (assert_status "200" $status "Get member request")) {
        return $false
    }

    if (-not (assert_json_field $body "id" "Member has id")) {
        return $false
    }

    return $true
}

function test_members_delete {
    if ([string]::IsNullOrWhiteSpace($Script:CreatedMemberId)) {
        log_warn "Skipping DELETE member test (no member created)"
        return $true
    }

    log_info "Testing DELETE /api/v1/members/$Script:CreatedMemberId"

    $response = http_delete "/members/$Script:CreatedMemberId"
    $status = [string]$response.StatusCode

    log_info "Response status: $status"

    if ($status -eq "204" -or $status -eq "200") {
        log_success "Delete member request (HTTP $status)"
        return $true
    }

    log_error "Delete member request (Expected HTTP 204 or 200, got $status)"
    return $false
}

function run_members_tests {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor White
    Write-Host "Members Tests" -ForegroundColor White
    Write-Host "==================================" -ForegroundColor White

    test_members_create | Out-Null
    test_members_list | Out-Null
    test_members_get | Out-Null
    test_members_delete | Out-Null

    Write-Host ""
}


