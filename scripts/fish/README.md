# C3PO API Test Suite (Fish Shell)

基于Fish Shell和curl的模块化API测试套件。

## 目录结构

```
fish/
├── config.fish           # 配置文件（URL、认证信息等）
├── lib.fish             # 公共函数库（HTTP请求、断言等）
├── run_tests.fish       # 主测试入口
├── test_auth.fish       # 认证API测试
├── test_dashboard.fish  # Dashboard API测试
├── test_members.fish    # Members API测试
├── test_activities.fish # Activities API测试
└── README.md           # 本文件
```

## 依赖

- Fish Shell
- curl
- jq

在Arch Linux上安装：
```bash
sudo pacman -S fish curl jq
```

## 使用方法

### 运行所有测试
```bash
fish scripts/fish/run_tests.fish
```

### 运行单个测试模块
```bash
# 只测试认证
fish scripts/fish/test_auth.fish -c run_auth_tests

# 只测试Dashboard
fish scripts/fish/test_dashboard.fish -c run_dashboard_tests

# 只测试Members
fish scripts/fish/test_members.fish -c run_members_tests
```

### 修改配置
编辑 `config.fish` 文件修改API URL、认证信息等：

```fish
set -gx API_BASE_URL "http://localhost:8080/api/v1"
set -gx ADMIN_USERNAME "admin"
set -gx ADMIN_PASSWORD "admin123"
```

## 测试输出

测试会输出彩色的结果：
- 🔵 蓝色 - 信息日志
- ✅ 绿色 - 测试通过
- ❌ 红色 - 测试失败
- ⚠️  黄色 - 警告

示例输出：
```
==================================
Authentication Tests
==================================
[INFO] Testing POST /api/v1/auth/login
[✓] Login request (HTTP 200)
[✓] Login response has accessToken (field 'accessToken' exists)
[✓] Login response has tokenType (field 'tokenType' exists)

==================================
Test Summary
==================================
Passed: 15
Failed: 0
Total:  15
==================================
```

## 添加新测试

1. 创建新的测试文件 `test_xxx.fish`
2. 引入函数库：`source (dirname (status --current-filename))/lib.fish`
3. 编写测试函数
4. 创建 `run_xxx_tests` 函数
5. 在 `run_tests.fish` 中引入并调用

示例：
```fish
#!/usr/bin/env fish
source (dirname (status --current-filename))/lib.fish

function test_my_api
    log_info "Testing my API"
    
    set -l response (http_get "/my/endpoint")
    set -l parsed (parse_response $response)
    set -l body $parsed[1]
    set -l status $parsed[2]
    
    assert_status "200" "$status" "My API request"
end

function run_my_tests
    echo "My Tests"
    test_my_api
end
```

## 可用的辅助函数

### HTTP请求
- `http_get <path>` - GET请求
- `http_post <path> <json_data>` - POST请求
- `http_put <path> <json_data>` - PUT请求
- `http_delete <path>` - DELETE请求

### 断言
- `assert_status <expected> <actual> <message>` - 检查HTTP状态码
- `assert_json_field <json> <field> <message>` - 检查JSON字段存在

### Token管理
- `save_token <json>` - 从响应中提取并保存token
- `clear_token` - 清除保存的token

### 日志
- `log_info <message>` - 信息日志
- `log_success <message>` - 成功日志（计数+1）
- `log_error <message>` - 错误日志（计数+1）
- `log_warn <message>` - 警告日志

## 调试

查看详细的请求和响应信息，函数会自动打印请求URL和响应体。

如需更详细的curl输出，可以在HTTP函数中添加 `-v` 参数：
```fish
curl -v -s -w "\n%{http_code}" ...
```

## 退出码

- `0` - 所有测试通过
- `1` - 至少有一个测试失败

