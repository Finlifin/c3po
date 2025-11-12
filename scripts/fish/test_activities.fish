#!/usr/bin/env fish
# Activities API测试

source (dirname (status --current-filename))/lib.fish

set -g CREATED_ACTIVITY_ID ""

function test_activities_create
    log_info "Testing POST /api/activities"
    
    set -l timestamp (date +%s)
    set -l payload (printf '{"name":"Test Activity %s","description":"Test activity description","activityDate":"2024-12-31","location":"Test Location","capacity":50,"status":"upcoming"}' $timestamp)
    
    set -l response (http_post "/activities" $payload)
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response body: $body"
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "Create activity request"
        return 1
    end
    
    if not assert_json_field "$body" "id" "Activity response has id"
        return 1
    end
    
    set -g CREATED_ACTIVITY_ID (echo $body | jq -r '.id')
    log_info "Created activity ID: $CREATED_ACTIVITY_ID"
    
    return 0
end

function test_activities_list
    log_info "Testing GET /api/activities"
    
    set -l response (http_get "/activities?page=1&limit=20")
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "List activities request"
        return 1
    end
    
    if not assert_json_field "$body" "items" "Activities response has items"
        return 1
    end
    
    return 0
end

function test_activities_get
    if test -z "$CREATED_ACTIVITY_ID"
        log_warn "Skipping GET activity test (no activity created)"
        return 0
    end
    
    log_info "Testing GET /api/activities/$CREATED_ACTIVITY_ID"
    
    set -l response (http_get "/activities/$CREATED_ACTIVITY_ID")
    set -l parsed (parse_response $response)
    
    set -l body $parsed[1]
    set -l http_code $parsed[2]
    
    log_info "Response status: $http_code"
    
    if not assert_status "200" "$http_code" "Get activity request"
        return 1
    end
    
    if not assert_json_field "$body" "id" "Activity has id"
        return 1
    end
    
    return 0
end

function run_activities_tests
    echo ""
    echo "=================================="
    echo "Activities Tests"
    echo "=================================="
    
    test_activities_create
    test_activities_list
    test_activities_get
    
    echo ""
end

