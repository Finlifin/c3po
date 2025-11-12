#!/usr/bin/env fish
# API测试辅助函数库

# 加载配置
source (dirname (status --current-filename))/config.fish

# 打印彩色消息
function log_info
    printf '%b(INFO)%b %s\n' "$COLOR_BLUE" "$COLOR_RESET" "$argv"
end

function log_success
    printf '%b(✓)%b %s\n' "$COLOR_GREEN" "$COLOR_RESET" "$argv"
    set -gx TESTS_PASSED (math $TESTS_PASSED + 1)
end

function log_error
    printf '%b(✗)%b %s\n' "$COLOR_RED" "$COLOR_RESET" "$argv"
    set -gx TESTS_FAILED (math $TESTS_FAILED + 1)
end

function log_warn
    printf '%b(WARN)%b %s\n' "$COLOR_YELLOW" "$COLOR_RESET" "$argv"
end

# HTTP请求函数
function http_get
    set -l path $argv[1]
    set -l token ""
    
    if test -f $TOKEN_FILE
        set token (cat $TOKEN_FILE)
    end
    
    if test -n "$token"
        curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    else
        curl -s -w "\n%{http_code}" \
            -H "Content-Type: application/json" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    end
end

function http_post
    set -l path $argv[1]
    set -l data $argv[2]
    set -l token ""
    
    if test -f $TOKEN_FILE
        set token (cat $TOKEN_FILE)
    end
    
    if test -n "$token"
        curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    else
        curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    end
end

function http_put
    set -l path $argv[1]
    set -l data $argv[2]
    set -l token ""
    
    if test -f $TOKEN_FILE
        set token (cat $TOKEN_FILE)
    end
    
    if test -n "$token"
        curl -s -w "\n%{http_code}" \
            -X PUT \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    else
        curl -s -w "\n%{http_code}" \
            -X PUT \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    end
end

function http_delete
    set -l path $argv[1]
    set -l token ""
    
    if test -f $TOKEN_FILE
        set token (cat $TOKEN_FILE)
    end
    
    if test -n "$token"
        curl -s -w "\n%{http_code}" \
            -X DELETE \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    else
        curl -s -w "\n%{http_code}" \
            -X DELETE \
            -H "Content-Type: application/json" \
            --max-time $API_TIMEOUT \
            "$API_BASE_URL$path"
    end
end

# 解析响应（最后一行是状态码）
function parse_response
    set -l lines (string split "\n" -- $argv)
    set -l http_code $lines[-1]
    set -l body (string join "\n" $lines[1..-2])
    
    echo $body
    echo $http_code
end

# 检查HTTP状态码
function assert_status
    set -l expected $argv[1]
    set -l actual $argv[2]
    set -l message $argv[3]
    
    if test "$actual" = "$expected"
        log_success "$message (HTTP $actual)"
        return 0
    else
        log_error "$message (Expected HTTP $expected, got $actual)"
        return 1
    end
end

# 检查JSON字段存在
function assert_json_field
    set -l json $argv[1]
    set -l field $argv[2]
    set -l message $argv[3]
    
    if echo $json | jq -e ".$field" >/dev/null 2>&1
        log_success "$message (field '$field' exists)"
        return 0
    else
        log_error "$message (field '$field' missing)"
        return 1
    end
end

# 保存token
function save_token
    set -l json $argv[1]
    set -l token (echo $json | jq -r '.accessToken // empty')
    
    if test -n "$token"
        echo $token > $TOKEN_FILE
        log_info "Token saved"
        return 0
    else
        log_error "No token in response"
        return 1
    end
end

# 清理token
function clear_token
    rm -f $TOKEN_FILE
    log_info "Token cleared"
end

# 打印测试统计
function print_summary
    echo ""
    echo "=================================="
    echo "Test Summary"
    echo "=================================="
    echo -e "Passed: $COLOR_GREEN$TESTS_PASSED$COLOR_RESET"
    echo -e "Failed: $COLOR_RED$TESTS_FAILED$COLOR_RESET"
    echo "Total:  "(math $TESTS_PASSED + $TESTS_FAILED)
    echo "=================================="
    
    if test $TESTS_FAILED -eq 0
        return 0
    else
        return 1
    end
end

