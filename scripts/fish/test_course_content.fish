#!/usr/bin/env fish
# 课程章节与资源相关测试

if not functions -q log_info
    source (dirname (status --current-filename))/lib.fish
end

set -gx COURSE_CONTENT_TEACHER_USERNAME ""
set -gx COURSE_CONTENT_TEACHER_PASSWORD ""
set -gx COURSE_CONTENT_COURSE_ID ""
set -gx COURSE_CONTENT_MODULE_ID ""

function course_content_login
    set -l username $argv[1]
    set -l password $argv[2]

    set -l payload (printf '{"identifier":"%s","password":"%s"}' $username $password)
    set -l response (http_post "/auth/login" $payload)
    set -l parsed (parse_response $response)

    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "200" "$http_code" "Login as $username"
        return 1
    end

    if not assert_json_field "$body" "accessToken" "Login response has accessToken"
        return 1
    end

    save_token "$body" >/dev/null
    return 0
end

function course_content_create_teacher
    log_info "Creating temporary teacher via POST /api/v1/admin/users"

    set -l suffix (string join "" (date +%s) (random))
    set -l username "auto-teacher-$suffix"
    set -l email "auto-teacher-$suffix@example.com"
    set -l password "Teacher#$suffix"

    set -l payload (printf '{
  "users": [
    {
      "username": "%s",
      "email": "%s",
      "password": "%s",
      "role": "TEACHER",
      "status": "ACTIVE",
      "teacherProfile": {
        "teacherNo": "T%s",
        "department": "Mathematics",
        "title": "Lecturer",
        "subjects": ["Linear Algebra", "Discrete Math"]
      }
    }
  ]
}' $username $email $password $suffix)

    set -l response (http_post "/admin/users" $payload)
    set -l parsed (parse_response $response)
    set -l http_code $parsed[2]

    if not assert_status "201" "$http_code" "Create temporary teacher"
        return 1
    end

    set -gx COURSE_CONTENT_TEACHER_USERNAME $username
    set -gx COURSE_CONTENT_TEACHER_PASSWORD $password

    log_success "Created teacher $username"
    return 0
end

function course_content_create_course
    if test -z "$COURSE_CONTENT_TEACHER_USERNAME"
        log_warn "Skipping course creation (no teacher)"
        return 0
    end

    log_info "Testing POST /api/v1/courses as teacher"

    set -l suffix (string join "" (date +%s) (random))
    set -l payload (printf '{
  "name": "Automated Course %s",
  "semester": "2025春",
  "credit": 3,
  "enrollLimit": 50
}' $suffix)

    set -l response (http_post "/courses" $payload)
    set -l parsed (parse_response $response)
    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "201" "$http_code" "Create course"
        return 1
    end

    if not assert_json_field "$body" "data.id" "Course creation response has id"
        return 1
    end

    set -l course_id (echo $body | jq -r '.data.id // empty')
    if test -z "$course_id"
        log_error "Failed to extract course id"
        return 1
    end

    set -gx COURSE_CONTENT_COURSE_ID $course_id
    log_success "Created course $course_id"
    return 0
end

function course_content_create_module
    if test -z "$COURSE_CONTENT_COURSE_ID"
        log_warn "Skipping module creation (no course id)"
        return 0
    end

    log_info "Testing POST /api/v1/courses/$COURSE_CONTENT_COURSE_ID/modules"

    set -l payload '{
  "title": "第 1 周 · 自动化测试章节",
  "displayOrder": 1,
  "releaseAt": "2025-09-01T00:00:00Z"
}'

    set -l response (http_post "/courses/$COURSE_CONTENT_COURSE_ID/modules" $payload)
    set -l parsed (parse_response $response)
    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "200" "$http_code" "Create course module"
        return 1
    end

    if not assert_json_field "$body" "data.id" "Module creation response has id"
        return 1
    end

    set -gx COURSE_CONTENT_MODULE_ID (echo $body | jq -r '.data.id // empty')
    log_success "Created module $COURSE_CONTENT_MODULE_ID"
    return 0
end

function course_content_get_modules
    if test -z "$COURSE_CONTENT_COURSE_ID"
        log_warn "Skipping GET modules test (no course id)"
        return 0
    end

    log_info "Testing GET /api/v1/courses/$COURSE_CONTENT_COURSE_ID/modules"

    set -l response (http_get "/courses/$COURSE_CONTENT_COURSE_ID/modules")
    set -l parsed (parse_response $response)
    set -l body $parsed[1]
    set -l http_code $parsed[2]

    if not assert_status "200" "$http_code" "List course modules"
        return 1
    end

    if not assert_json_field "$body" "data" "Modules list has data"
        return 1
    end

    if test -n "$COURSE_CONTENT_MODULE_ID"
        set -l module_title (echo $body | jq -r --arg id "$COURSE_CONTENT_MODULE_ID" '.data[] | select(.id == $id) | .title // empty')
        if test -n "$module_title"
            log_success "Modules list contains created module ($module_title)"
        else
            log_warn "Created module not found in list response"
        end
    end
end

function run_course_content_tests
    echo ""
    echo "=================================="
    echo "Course Content Tests"
    echo "=================================="

    if not course_content_login $ADMIN_USERNAME $ADMIN_PASSWORD
        log_error "Admin login failed, skipping course content tests"
        echo ""
        return 1
    end

    if not course_content_create_teacher
        echo ""
        return 1
    end

    if not course_content_login $COURSE_CONTENT_TEACHER_USERNAME $COURSE_CONTENT_TEACHER_PASSWORD
        log_error "Teacher login failed, skipping course content tests"
        echo ""
        return 1
    end

    course_content_create_course
    course_content_create_module
    course_content_get_modules

    course_content_login $ADMIN_USERNAME $ADMIN_PASSWORD >/dev/null

    echo ""
end


