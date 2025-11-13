#!/usr/bin/env bash
# Quick diagnostic script for checking API connectivity (Bash)

API_BASE="${API_BASE:-http://localhost:8080}"

printf '==================================\n'
printf 'Quick Diagnostic Test\n'
printf '==================================\n\n'

printf '1. Testing server health...\n'
health_response="$(curl -sS -w $'\n%{http_code}' "$API_BASE/actuator/health" 2>&1)"
printf 'Health check response:\n%s\n\n' "$health_response"

printf '2. Testing /api/v1/auth/login endpoint...\n'
printf 'URL: %s/api/v1/auth/login\n' "$API_BASE"
login_payload='{"identifier":"admin","password":"admin123"}'
printf 'Payload: %s\n\n' "$login_payload"
printf 'Response:\n'
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d "$login_payload" \
  "$API_BASE/api/v1/auth/login" 2>&1 | head -50
printf '\n'

printf '3. Testing if /auth/login works (legacy path)...\n'
printf 'URL: %s/auth/login\n' "$API_BASE"
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d "$login_payload" \
  "$API_BASE/auth/login" 2>&1 | head -50
printf '\n'

printf '==================================\n'
printf 'Diagnostic Complete\n'
printf '==================================\n'

