#!/usr/bin/env pwsh
# Admin user management API tests (PowerShell)

param()

$Script:AdminUsersLastId = $null
$Script:AdminUsersLastUsername = $null
$Script:AdminUsersLastPassword = $null

if (-not (Get-Command log_info -ErrorAction SilentlyContinue)) {
    . (Join-Path (Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent) "lib.ps1")
}

function AdminUsers-LoginAs {
    param(
        [Parameter(Mandatory = $true)][string]$Username,
        [Parameter(Mandatory = $true)][string]$Password
    )

    $payload = ('{{"identifier":"{0}","password":"{1}"}}' -f $Username, $Password)
    $response = http_post "/auth/login" $payload
    $status = [string]$response.StatusCode
    $body = $response.Body

    if (-not (assert_status "200" $status "Login as $Username")) {
        return $false
    }

    if (-not (assert_json_field $body "accessToken" "Login response has accessToken")) {
        return $false
    }

    save_token $body | Out-Null
    return $true
}

function AdminUsers-AssertJsonEquals {
    param(
        [Parameter(Mandatory = $true)][string]$Json,
        [Parameter(Mandatory = $true)][string]$Field,
        [Parameter(Mandatory = $true)][string]$Expected,
        [Parameter(Mandatory = $true)][string]$Message
    )

    if ([string]::IsNullOrWhiteSpace($Json)) {
        log_error "$Message (empty JSON payload)"
        return $false
    }

    try {
        $parsed = $Json | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        log_error "$Message (invalid JSON payload)"
        return $false
    }

    $actual = Get-JsonFieldValue -JsonObject $parsed -FieldPath $Field
    if ($actual -eq $Expected) {
        log_success "$Message ('$actual')"
        return $true
    }

    if ([string]::IsNullOrEmpty($actual)) {
        $actual = "<empty>"
    }
    log_error "$Message (expected '$Expected', got '$actual')"
    return $false
}

function Test-AdminUsersList {
    log_info "Testing GET /api/v1/admin/users"

    $response = http_get "/v1/admin/users?page=1&pageSize=5"
    $status = [string]$response.StatusCode
    $body = $response.Body

    if (-not (assert_status "200" $status "List admin users")) {
        return
    }

    assert_json_field $body "data" "Users list contains data" | Out-Null
}

function Test-AdminUsersBulkCreate {
    log_info "Testing POST /api/v1/admin/users (bulk create)"

    $suffix = "{0}{1}" -f [int][DateTimeOffset]::Now.ToUnixTimeSeconds(), (Get-Random -Minimum 1000 -Maximum 9999)
    $username = "auto-student-$suffix"
    $email = "auto-student-$suffix@example.com"
    $password = "Student#$suffix"

    $payload = @"
{
  "users": [
    {
      "username": "$username",
      "email": "$email",
      "password": "$password",
      "role": "STUDENT",
      "status": "ACTIVE",
      "studentProfile": {
        "studentNo": "S$suffix",
        "grade": "2025",
        "major": "Computer Science",
        "className": "CS-$suffix"
      }
    }
  ]
}
"@

    $response = http_post "/v1/admin/users" $payload
    $status = [string]$response.StatusCode
    $body = $response.Body

    if (-not (assert_status "201" $status "Bulk create student user")) {
        return
    }

    if (-not (assert_json_field $body "data.created" "Bulk create response has created list")) {
        return
    }

    $parsed = $body | ConvertFrom-Json
    $createdId = $parsed.data.created[0].id
    if ([string]::IsNullOrWhiteSpace($createdId)) {
        log_error "Failed to extract created user id"
        return
    }

    $Script:AdminUsersLastId = $createdId
    $Script:AdminUsersLastUsername = $username
    $Script:AdminUsersLastPassword = $password

    log_success "Created student user $username ($createdId)"
}

function Test-AdminUsersUpdateStatus {
    if ([string]::IsNullOrWhiteSpace($Script:AdminUsersLastId)) {
        log_warn "Skipping update status test (no user id)"
        return
    }

    log_info "Testing PUT /api/v1/admin/users/$($Script:AdminUsersLastId)/status"

    $payload = '{"status":"DISABLED","reason":"Automated regression test disable"}'
    $response = http_put "/v1/admin/users/$($Script:AdminUsersLastId)/status" $payload
    $status = [string]$response.StatusCode
    $body = $response.Body

    if (-not (assert_status "200" $status "Update user status")) {
        return
    }

    if (-not (assert_json_field $body "data.status" "Status update response has status field")) {
        return
    }

    AdminUsers-AssertJsonEquals $body "data.status" "DISABLED" "User status updated to DISABLED" | Out-Null
}

function run_admin_users_tests {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor White
    Write-Host "Admin User Management Tests" -ForegroundColor White
    Write-Host "==================================" -ForegroundColor White

    if (-not (AdminUsers-LoginAs -Username $Script:AdminUsername -Password $Script:AdminPassword)) {
        log_error "Admin login failed, skipping admin user tests"
        Write-Host ""
        return
    }

    Test-AdminUsersList
    Test-AdminUsersBulkCreate
    Test-AdminUsersUpdateStatus

    Write-Host ""
}


