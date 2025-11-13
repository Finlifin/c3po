#!/usr/bin/env pwsh
# Activities API tests (PowerShell)

param()

$Script:ScriptDir = Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent
if (-not (Get-Command log_info -ErrorAction SilentlyContinue)) {
    . (Join-Path $Script:ScriptDir "lib.ps1")
}

$Script:CreatedActivityId = ""

function test_activities_create {
    log_info "Testing POST /api/v1/activities"

    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $payload = ('{{"name":"Test Activity {0}","description":"Test activity description","activityDate":"2024-12-31","location":"Test Location","capacity":50,"status":"upcoming"}}' -f $timestamp)

    $response = http_post "/activities" $payload
    $body = $response.Body
    $status = [string]$response.StatusCode

    log_info "Response body: $body"
    log_info "Response status: $status"

    if (-not (assert_status "200" $status "Create activity request")) {
        return $false
    }

    if (-not (assert_json_field $body "id" "Activity response has id")) {
        return $false
    }

    try {
        $Script:CreatedActivityId = (Get-JsonFieldValue -JsonObject ($body | ConvertFrom-Json) -FieldPath "id")
    }
    catch {
        $Script:CreatedActivityId = $null
    }

    if ([string]::IsNullOrWhiteSpace($Script:CreatedActivityId)) {
        log_warn "Could not determine activity ID from response"
    }
    else {
        log_info "Created activity ID: $Script:CreatedActivityId"
    }

    return $true
}

function test_activities_list {
    log_info "Testing GET /api/v1/activities"

    $response = http_get "/activities?page=1&limit=20"
    $status = [string]$response.StatusCode
    $body = $response.Body

    log_info "Response status: $status"

    if (-not (assert_status "200" $status "List activities request")) {
        return $false
    }

    if (-not (assert_json_field $body "items" "Activities response has items")) {
        return $false
    }

    return $true
}

function test_activities_get {
    if ([string]::IsNullOrWhiteSpace($Script:CreatedActivityId)) {
        log_warn "Skipping GET activity test (no activity created)"
        return $true
    }

    log_info "Testing GET /api/v1/activities/$Script:CreatedActivityId"

    $response = http_get "/activities/$Script:CreatedActivityId"
    $status = [string]$response.StatusCode
    $body = $response.Body

    log_info "Response status: $status"

    if (-not (assert_status "200" $status "Get activity request")) {
        return $false
    }

    if (-not (assert_json_field $body "id" "Activity has id")) {
        return $false
    }

    return $true
}

function run_activities_tests {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor White
    Write-Host "Activities Tests" -ForegroundColor White
    Write-Host "==================================" -ForegroundColor White

    test_activities_create | Out-Null
    test_activities_list | Out-Null
    test_activities_get | Out-Null

    Write-Host ""
}


