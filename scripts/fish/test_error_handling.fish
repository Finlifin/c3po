#!/usr/bin/env fish

# 测试新的错误处理系统
# 验证各种错误场景是否返回符合 API 文档的响应格式

set -l BASE_URL "http://localhost:8080"
set -l ADMIN_TOKEN ""

echo "🧪 测试错误处理系统"
echo "===================="
echo ""

# 颜色定义
set -l GREEN "\033[0;32m"
set -l RED "\033[0;31m"
set -l YELLOW "\033[1;33m"
set -l NC "\033[0m" # No Color

function print_test
    echo -e "$YELLOW▶ $argv[1]$NC"
end

function print_success
    echo -e "$GREEN✓ $argv[1]$NC"
end

function print_error
    echo -e "$RED✗ $argv[1]$NC"
end

function test_response
    set -l response $argv[1]
    set -l test_name $argv[2]
    
    # 检查响应是否包含必需字段
    if echo $response | jq -e '.timestamp' > /dev/null 2>&1
        and echo $response | jq -e '.status' > /dev/null 2>&1
        and echo $response | jq -e '.error' > /dev/null 2>&1
        and echo $response | jq -e '.message' > /dev/null 2>&1
        print_success "$test_name - 响应格式正确"
        echo $response | jq '.'
        return 0
    else
        print_error "$test_name - 响应格式不正确"
        echo $response | jq '.'
        return 1
    end
end

# 1. 测试 404 错误
print_test "测试 1: 404 Not Found"
set response (curl -s "$BASE_URL/api/v1/nonexistent")
test_response "$response" "404错误"
echo ""

# 2. 测试 405 Method Not Allowed
print_test "测试 2: 405 Method Not Allowed"
set response (curl -s -X DELETE "$BASE_URL/api/v1/auth/login")
test_response "$response" "405错误"
echo ""

# 3. 测试 400 Bad Request (无效 JSON)
print_test "测试 3: 400 Bad Request (无效JSON)"
set response (curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{invalid json}')
test_response "$response" "400错误(无效JSON)"
echo ""

# 4. 测试 400 Validation Error
print_test "测试 4: 400 Validation Error"
set response (curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "ab",
        "email": "invalid-email",
        "password": "123",
        "role": "STUDENT"
    }')
test_response "$response" "400错误(验证失败)"
# 检查是否有 errors 字段
if echo $response | jq -e '.errors' > /dev/null 2>&1
    print_success "包含 errors 字段（字段级错误）"
else
    print_error "缺少 errors 字段"
end
echo ""

# 5. 登录获取 token
print_test "测试 5: 登录获取 Admin Token"
set login_response (curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "identifier": "admin",
        "password": "Admin123!"
    }')

set ADMIN_TOKEN (echo $login_response | jq -r '.accessToken')
if test -n "$ADMIN_TOKEN" -a "$ADMIN_TOKEN" != "null"
    print_success "成功获取 Admin Token"
else
    print_error "无法获取 Admin Token"
    echo $login_response | jq '.'
    exit 1
end
echo ""

# 6. 测试 401 Unauthorized
print_test "测试 6: 401 Unauthorized"
set response (curl -s "$BASE_URL/api/v1/admin/users")
test_response "$response" "401错误(未认证)"
echo ""

# 7. 测试 403 Forbidden (需要先创建一个普通用户)
print_test "测试 7: 创建普通学生用户"
set student_register (curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "teststudent",
        "email": "test@example.com",
        "password": "Test123!",
        "role": "STUDENT"
    }')
set STUDENT_TOKEN (echo $student_register | jq -r '.accessToken')
if test -n "$STUDENT_TOKEN" -a "$STUDENT_TOKEN" != "null"
    print_success "成功创建学生用户"
else
    print_error "无法创建学生用户"
end
echo ""

print_test "测试 8: 403 Forbidden (学生访问管理员接口)"
set response (curl -s "$BASE_URL/api/v1/admin/users" \
    -H "Authorization: Bearer $STUDENT_TOKEN")
test_response "$response" "403错误(权限不足)"
echo ""

# 9. 测试无限递归问题是否已修复
print_test "测试 9: POST /api/v1/admin/users (验证无限递归已修复)"
set response (curl -s -X POST "$BASE_URL/api/v1/admin/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "users": []
    }')
echo "响应:"
echo $response | jq '.'
if echo $response | jq -e '.status' > /dev/null 2>&1
    print_success "无限递归问题已修复 - 正常返回错误响应"
else
    print_error "可能仍存在问题"
end
echo ""

echo "===================="
echo "✅ 错误处理测试完成"

