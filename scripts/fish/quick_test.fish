#!/usr/bin/env fish
# 快速诊断测试 - 用于调试API连接问题

set API_BASE "http://localhost:8080"

echo "=================================="
echo "Quick Diagnostic Test"
echo "=================================="
echo ""

echo "1. Testing server health..."
set health_response (curl -s -w "\n%{http_code}" "$API_BASE/actuator/health" 2>&1)
echo "Health check response:"
echo $health_response
echo ""

echo "2. Testing /api/v1/auth/login endpoint..."
echo "URL: $API_BASE/api/v1/auth/login"
set login_payload '{"identifier":"admin","password":"admin123"}'
echo "Payload: $login_payload"
echo ""
echo "Response:"
curl -v -X POST \
    -H "Content-Type: application/json" \
    -d "$login_payload" \
    "$API_BASE/api/v1/auth/login" 2>&1 | head -50
echo ""

echo "3. Testing if /auth/login works (legacy path)..."
echo "URL: $API_BASE/auth/login"
curl -v -X POST \
    -H "Content-Type: application/json" \
    -d "$login_payload" \
    "$API_BASE/auth/login" 2>&1 | head -50
echo ""

echo "=================================="
echo "Diagnostic Complete"
echo "=================================="

