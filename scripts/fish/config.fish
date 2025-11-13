#!/usr/bin/env fish
# API测试配置文件

# API基础配置
set -gx API_BASE_URL "http://localhost:8080/api/v1"
set -gx API_TIMEOUT 10

# 认证配置
set -gx ADMIN_USERNAME "testadmin"
set -gx ADMIN_PASSWORD "admin123"

# 测试数据目录
set -gx TEST_DATA_DIR (dirname (status --current-filename))/data
set -gx TOKEN_FILE /tmp/c3po_test_token

# 颜色配置
set -gx COLOR_RESET "\033[0m"
set -gx COLOR_RED "\033[0;31m"
set -gx COLOR_GREEN "\033[0;32m"
set -gx COLOR_YELLOW "\033[0;33m"
set -gx COLOR_BLUE "\033[0;34m"

# 测试结果统计
set -gx TESTS_PASSED 0
set -gx TESTS_FAILED 0

