#!/usr/bin/env pwsh
# Course modules and resources API tests (PowerShell)

param()

$Script:CourseContentTeacherUsername = $null
$Script:CourseContentTeacherPassword = $null
$Script:CourseContentCourseId = $null
$Script:CourseContentModuleId = $null

if (-not (Get-Command log_info -ErrorAction SilentlyContinue)) {
    . (Join-Path (Split-Path -LiteralPath $MyInvocation.MyCommand.Path -Parent) "lib.ps1")
}

function CourseContent-Login {
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

function CourseContent-CreateTeacher {
    log_info "Creating temporary teacher via POST /api/v1/admin/users"

    $suffix = "{0}{1}" -f [int][DateTimeOffset]::Now.ToUnixTimeSeconds(), (Get-Random -Minimum 1000 -Maximum 9999)
    $username = "auto-teacher-$suffix"
    $email = "auto-teacher-$suffix@example.com"
    $password = "Teacher#$suffix"

    $payload = @"
{
  "users": [
    {
      "username": "$username",
      "email": "$email",
      "password": "$password",
      "role": "TEACHER",
      "status": "ACTIVE",
      "teacherProfile": {
        "teacherNo": "T$suffix",
        "department": "Mathematics",
        "title": "Lecturer",
        "subjects": ["Linear Algebra", "Discrete Math"]
      }
    }
  ]
}
"@

    $response = http_post "/v1/admin/users" $payload
    $status = [string]$response.StatusCode

    if (-not (assert_status "201" $status "Create temporary teacher")) {
        return $false
    }

    $Script:CourseContentTeacherUsername = $username
    $Script:CourseContentTeacherPassword = $password

    log_success "Created teacher $username"
    return $true
}

function CourseContent-CreateCourse {
    if ([string]::IsNullOrWhiteSpace($Script:CourseContentTeacherUsername)) {
        log_warn "Skipping course creation (no teacher available)"
        return
    }

    log_info "Testing POST /api/v1/courses as teacher"

    $suffix = "{0}{1}" -f [int][DateTimeOffset]::Now.ToUnixTimeSeconds(), (Get-Random -Minimum 100 -Maximum 999)
    $payload = @"
{
  "name": "Automated Course $suffix",
  "semester": "2025春",
  "credit": 3,
  "enrollLimit": 50
}
"@

    $response = http_post "/courses" $payload
    $status = [string]$response.StatusCode
    $body = $response.Body

    if (-not (assert_status "201" $status "Create course")) {
        return
    }

    if (-not (assert_json_field $body "data.id" "Course creation response has id")) {
        return
    }

    $parsed = $body | ConvertFrom-Json
    $courseId = $parsed.data.id
    if ([string]::IsNullOrWhiteSpace($courseId)) {
        log_error "Failed to extract course id"
        return
    }

    $Script:CourseContentCourseId = $courseId
    log_success "Created course $courseId"
}

function CourseContent-CreateModule {
    if ([string]::IsNullOrWhiteSpace($Script:CourseContentCourseId)) {
        log_warn "Skipping module creation (no course id)"
        return
    }

    log_info "Testing POST /api/v1/courses/$($Script:CourseContentCourseId)/modules"

    $payload = '{
  "title": "第 1 周 · 自动化测试章节",
  "displayOrder": 1,
  "releaseAt": "2025-09-01T00:00:00Z"
}'

    $response = http_post "/courses/$($Script:CourseContentCourseId)/modules" $payload
    $status = [string]$response.StatusCode
    $body = $response.Body

    if (-not (assert_status "200" $status "Create course module")) {
        return
    }

    if (-not (assert_json_field $body "data.id" "Module creation response has id")) {
        return
    }

    $parsed = $body | ConvertFrom-Json
    $moduleId = $parsed.data.id
    $Script:CourseContentModuleId = $moduleId

    log_success "Created module $moduleId"
}

function CourseContent-GetModules {
    if ([string]::IsNullOrWhiteSpace($Script:CourseContentCourseId)) {
        log_warn "Skipping GET modules test (no course id)"
        return
    }

    log_info "Testing GET /api/v1/courses/$($Script:CourseContentCourseId)/modules"

    $response = http_get "/courses/$($Script:CourseContentCourseId)/modules"
    $status = [string]$response.StatusCode
    $body = $response.Body

    if (-not (assert_status "200" $status "List course modules")) {
        return
    }

    if (-not (assert_json_field $body "data" "Modules list has data")) {
        return
    }

    if (-not [string]::IsNullOrWhiteSpace($Script:CourseContentModuleId)) {
        try {
            $parsed = $body | ConvertFrom-Json
            $match = $parsed.data | Where-Object { $_.id -eq $Script:CourseContentModuleId }
            if ($null -ne $match) {
                log_success ("Modules list contains created module ({0})" -f $match.title)
            }
            else {
                log_warn "Created module not found in list response"
            }
        }
        catch {
            log_warn "Unable to parse modules list response"
        }
    }
}

function run_course_content_tests {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor White
    Write-Host "Course Content Tests" -ForegroundColor White
    Write-Host "==================================" -ForegroundColor White

    if (-not (CourseContent-Login -Username $Script:AdminUsername -Password $Script:AdminPassword)) {
        log_error "Admin login failed, skipping course content tests"
        Write-Host ""
        return
    }

    if (-not (CourseContent-CreateTeacher)) {
        Write-Host ""
        return
    }

    if (-not (CourseContent-Login -Username $Script:CourseContentTeacherUsername -Password $Script:CourseContentTeacherPassword)) {
        log_error "Teacher login failed, skipping course content tests"
        Write-Host ""
        return
    }

    CourseContent-CreateCourse
    CourseContent-CreateModule
    CourseContent-GetModules

    CourseContent-Login -Username $Script:AdminUsername -Password $Script:AdminPassword | Out-Null

    Write-Host ""
}


