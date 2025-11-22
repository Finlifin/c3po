#!/bin/bash

# User Management API Test Script
# This script tests user management and password change APIs

BASE_URL="${BASE_URL:-http://localhost:8080}"
API_PREFIX="${API_PREFIX:-/api/v1}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "User Management API Test Script"
echo "========================================="
echo "Base URL: $BASE_URL$API_PREFIX"
echo ""

# Test user credentials
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-Admin123!}"

echo -e "${YELLOW}Step 1: Login as admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL$API_PREFIX/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"identifier\": \"$ADMIN_USER\",
    \"password\": \"$ADMIN_PASS\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

echo -e "${YELLOW}Step 2: Get current user info${NC}"
CURRENT_USER_RESPONSE=$(curl -s -X GET "$BASE_URL$API_PREFIX/users/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Current user info:"
echo $CURRENT_USER_RESPONSE | python3 -m json.tool
echo ""

USER_ID=$(echo $CURRENT_USER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
CURRENT_EMAIL=$(echo $CURRENT_USER_RESPONSE | grep -o '"email":"[^"]*' | cut -d'"' -f4)

echo -e "${YELLOW}Step 3: Update user info (email)${NC}"
NEW_EMAIL="${CURRENT_EMAIL%.*}@updated.com"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL$API_PREFIX/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$NEW_EMAIL\"
  }")

if echo "$UPDATE_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ User info updated successfully${NC}"
else
  echo -e "${RED}✗ Update failed${NC}"
  echo "Response: $UPDATE_RESPONSE"
fi
echo ""

echo -e "${YELLOW}Step 4: Change password${NC}"
NEW_PASSWORD="${NEW_PASSWORD:-NewPassword123!}"
CHANGE_PASSWORD_RESPONSE=$(curl -s -X PATCH "$BASE_URL$API_PREFIX/users/me/password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"currentPassword\": \"$ADMIN_PASS\",
    \"newPassword\": \"$NEW_PASSWORD\",
    \"confirmPassword\": \"$NEW_PASSWORD\"
  }")

if echo "$CHANGE_PASSWORD_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ Password changed successfully${NC}"
else
  echo -e "${RED}✗ Password change failed${NC}"
  echo "Response: $CHANGE_PASSWORD_RESPONSE"
fi
echo ""

echo -e "${YELLOW}Step 5: Login with new password${NC}"
NEW_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL$API_PREFIX/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"identifier\": \"$ADMIN_USER\",
    \"password\": \"$NEW_PASSWORD\"
  }")

NEW_TOKEN=$(echo $NEW_LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$NEW_TOKEN" ]; then
  echo -e "${RED}✗ Login with new password failed${NC}"
else
  echo -e "${GREEN}✓ Login with new password successful${NC}"
  TOKEN=$NEW_TOKEN
fi
echo ""

echo -e "${YELLOW}Step 6: Restore original password${NC}"
RESTORE_RESPONSE=$(curl -s -X PATCH "$BASE_URL$API_PREFIX/users/me/password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"currentPassword\": \"$NEW_PASSWORD\",
    \"newPassword\": \"$ADMIN_PASS\",
    \"confirmPassword\": \"$ADMIN_PASS\"
  }")

if echo "$RESTORE_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ Password restored${NC}"
else
  echo -e "${RED}✗ Password restore failed${NC}"
fi
echo ""

echo -e "${YELLOW}Step 7: Restore original email${NC}"
RESTORE_EMAIL_RESPONSE=$(curl -s -X PATCH "$BASE_URL$API_PREFIX/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CURRENT_EMAIL\"
  }")

if echo "$RESTORE_EMAIL_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ Email restored${NC}"
else
  echo -e "${RED}✗ Email restore failed${NC}"
fi
echo ""

echo -e "${YELLOW}Step 8: Admin update user (if user ID is available)${NC}"
if [ ! -z "$USER_ID" ]; then
  ADMIN_UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL$API_PREFIX/admin/users/$USER_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"ACTIVE\"
    }")
  
  if echo "$ADMIN_UPDATE_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓ Admin user update successful${NC}"
  else
    echo -e "${RED}✗ Admin user update failed${NC}"
    echo "Response: $ADMIN_UPDATE_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠ Skipping: User ID not available${NC}"
fi
echo ""

echo "========================================="
echo -e "${GREEN}Test completed!${NC}"
echo "========================================="

