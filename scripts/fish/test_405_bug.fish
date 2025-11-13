#!/usr/bin/env fish
# 测试HTTP 405错误是否会导致重定向循环

echo "Testing HTTP 405 Method Not Allowed bug..."
echo ""

echo "1. Testing GET on POST endpoint (should return 405 quickly):"
echo "URL: http://localhost:8080/api/v1/auth/login"
set start_time (date +%s)

# 使用短超时时间，如果挂起说明有问题
set response (curl -s -X GET \
    -H "Content-Type: application/json" \
    --max-time 3 \
    -w "\n%{http_code}" \
    http://localhost:8080/api/v1/auth/login 2>&1)

set end_time (date +%s)
set duration (math $end_time - $start_time)

echo "Duration: $duration seconds"

if test $duration -lt 3
    echo "✓ Request completed quickly (no redirect loop)"
    echo "Response:"
    echo $response
else
    echo "✗ Request took too long or timed out (possible redirect loop)"
    echo "Response (if any):"
    echo $response
end

echo ""
echo "2. Testing POST on GET endpoint (if exists):"
set response2 (curl -s -X POST \
    -H "Content-Type: application/json" \
    --max-time 3 \
    -w "\n%{http_code}" \
    http://localhost:8080/api/v1/dashboard/overview 2>&1)

echo "Response:"
echo $response2

echo ""
echo "3. Testing with authentication header:"
# 先登录获取token
set token_response (curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"identifier":"testadmin","password":"admin123"}' \
    http://localhost:8080/api/v1/auth/login)
set token (echo $token_response | jq -r '.accessToken // empty')

if test -n "$token"
    echo "Got token, testing 405 with auth..."
    set response3 (curl -s -X DELETE \
        -H "Authorization: Bearer $token" \
        --max-time 3 \
        -w "\n%{http_code}" \
        http://localhost:8080/api/v1/auth/login 2>&1)
    echo "Response:"
    echo $response3
else
    echo "Could not get token"
end

echo ""
echo "Test complete!"

