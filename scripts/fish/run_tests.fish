#!/usr/bin/env fish
# 主测试入口脚本

set SCRIPT_DIR (dirname (status --current-filename))
source $SCRIPT_DIR/lib.fish

# 检查依赖
function check_dependencies
    if not command -v curl >/dev/null
        log_error "curl is not installed"
        return 1
    end
    
    if not command -v jq >/dev/null
        log_error "jq is not installed"
        return 1
    end
    
    return 0
end

# 检查服务器是否运行
function check_server
    log_info "Checking if API server is running at $API_BASE_URL"
    
    # 尝试连接到登录端点（即使失败也说明服务器在运行）
    set -l response (curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$API_BASE_URL/auth/login" 2>/dev/null)
    
    # 401, 400, 405等都说明服务器在运行
    if test "$response" -ge "200" -a "$response" -lt "500"
        log_success "Server is running (HTTP $response)"
        return 0
    else
        log_error "Server is not reachable (HTTP $response)"
        log_info "Please start the server with: cd c3po && ./gradlew bootRun"
        return 1
    end
end

function main
    echo "=================================="
    echo "C3PO API Test Suite"
    echo "=================================="
    echo "Base URL: $API_BASE_URL"
    echo "Admin User: $ADMIN_USERNAME"
    echo ""
    
    # 检查依赖
    if not check_dependencies
        return 1
    end
    
    # 清理旧的token
    clear_token
    
    log_info "Skipping server health check, starting tests..."
    
    # 运行测试
    source $SCRIPT_DIR/test_auth.fish
    run_auth_tests
    
    # 如果认证成功，继续其他测试
    if test -f $TOKEN_FILE
        source $SCRIPT_DIR/test_dashboard.fish
        run_dashboard_tests
        
        source $SCRIPT_DIR/test_members.fish
        run_members_tests
        
        source $SCRIPT_DIR/test_activities.fish
        run_activities_tests

        source $SCRIPT_DIR/test_admin_users.fish
        run_admin_users_tests

        source $SCRIPT_DIR/test_course_content.fish
        run_course_content_tests
    else
        log_error "Authentication failed, skipping other tests"
    end
    
    # 打印汇总
    print_summary
    
    # 清理
    clear_token
    
    # 返回退出码
    if test $TESTS_FAILED -eq 0
        return 0
    else
        return 1
    end
end

# 执行主函数
main

