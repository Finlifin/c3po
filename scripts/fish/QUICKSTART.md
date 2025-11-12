# 快速开始

## 1. 运行快速诊断（推荐首先运行）

```bash
fish scripts/fish/quick_test.fish
```

这会测试：
- 服务器健康检查
- `/api/auth/login` 端点
- `/auth/login` 端点（用于诊断路径配置）

**查看输出，找到实际工作的路径！**

## 2. 运行完整测试套件

```bash
fish scripts/fish/run_tests.fish
```

这会按顺序运行：
1. 认证测试（登录、获取profile）
2. Dashboard测试
3. Members CRUD测试
4. Activities测试

## 3. 运行单个测试模块

```bash
# 只测试认证
fish scripts/fish/test_auth.fish -c run_auth_tests

# 只测试Members
fish scripts/fish/test_members.fish -c run_members_tests
```

## 4. 如果测试失败

### 检查服务器是否运行
```bash
curl http://localhost:8080/actuator/health
```

应该返回：`{"status":"UP"}`

### 检查路径配置
```bash
# 测试 /api 前缀
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'

# 测试无 /api 前缀
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'
```

看哪个返回成功，然后修改 `config.fish` 中的 `API_BASE_URL`。

### 检查管理员密码
默认配置：
- 用户名: `admin`
- 密码: `admin123`

如果不对，修改 `config.fish` 中的认证信息。

## 5. 修改配置

编辑 `scripts/fish/config.fish`:

```fish
# 修改API URL（根据快速测试结果）
set -gx API_BASE_URL "http://localhost:8080/api"

# 修改认证信息
set -gx ADMIN_USERNAME "admin"
set -gx ADMIN_PASSWORD "admin123"
```

## 常见问题

### Q: 提示 "command not found: fish"
A: 安装Fish Shell：`sudo pacman -S fish`

### Q: 提示 "command not found: jq"
A: 安装jq：`sudo pacman -S jq`

### Q: 连接超时
A: 
1. 检查服务器是否运行
2. 检查端口是否正确（默认8080）
3. 增加超时时间：修改 `config.fish` 中的 `API_TIMEOUT`

### Q: HTTP 401 Unauthorized
A: 检查用户名密码是否正确

### Q: HTTP 404 Not Found
A: 路径配置有问题，运行 `quick_test.fish` 诊断正确的路径

### Q: 看到很多 /auth/auth/auth...
A: 路径重复问题，检查：
1. Spring的 `@RequestMapping` 配置
2. 是否设置了 `server.servlet.context-path`
3. 测试脚本的 `API_BASE_URL` 配置

