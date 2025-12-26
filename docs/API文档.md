# 智慧学习平台 API 设计文档

## 1. 文档概述
- **版本**：v0.9.2（新增成绩与学习分析能力）
- **覆盖范围**：学生端、教师端、管理员端的核心功能接口；统一认证、消息通知、异步任务与运维相关接口。
- **目标读者**：后端/前端开发、QA、运维、产品经理、集成方。
- **接口前缀（当前实现）**：`/api/v1`

## 2. 接口通用约定

### 2.1 HTTP 与数据格式
- 请求与响应主体均采用 `application/json; charset=utf-8`；文件上传使用 `multipart/form-data`。
- 时间字段统一使用 ISO8601，带时区：`YYYY-MM-DDThh:mm:ssZ`。

### 2.2 认证与授权
- 当前实现基于 JWT 的无状态认证（Spring Security + OncePerRequestFilter）：
  - 登录/注册返回 `accessToken`（JWT，默认有效期由配置 `security.jwt.expiration-ms` 控制，单位毫秒）、`tokenType=Bearer`、`expiresIn`（毫秒）。
  - 客户端请求头携带 `Authorization: Bearer {accessToken}`。
  - 公开端点：`/api/v1/auth/**`、`/actuator/health`、`/error`；其余端点默认需要认证。
  - 未认证访问返回 `401`，鉴权不足返回 `403`。
- 配置：
  - `security.jwt.secret`（HS 密钥，至少 32 字符）
  - `security.jwt.expiration-ms`（Token 过期毫秒数，默认 3600000）
- 角色模型：`ROLE_STUDENT|ROLE_TEACHER|ROLE_ADMIN`（来自用户 `role` 枚举）。

### 2.3 幂等性与重试
- PUT/DELETE 接口需幂等；敏感 POST 接口通过 `Idempotency-Key` 头（UUID）保障重复请求安全。
- 异步任务接口提供任务状态查询，避免长轮询。

### 2.4 分页与排序
- 查询列表默认分页：`page`（默认 1）`pageSize`（默认 20，最大 100）。
- 排序参数：`sort=field,(asc|desc)`，多个字段以逗号分隔。

### 2.5 响应结构（当前实现）
- 成功响应：由各接口定义自由结构。
- 失败响应（全局异常处理 `RestExceptionHandler`）：
```json
{
  "timestamp": "2025-11-12T08:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Not authenticated",
  "errors": {
    "field": "error message (可选)"
  }
}
```
- 后续版本计划统一为标准包装结构（见原规范 2.5），上线前将配套改造异常处理器。

### 2.6 错误码分层

| 模块 | 错误码前缀 | 示例 |
| --- | --- | --- |
| 通用 | `COMMON` | `COMMON.NOT_FOUND`, `COMMON.VALIDATION_FAILED` |
| 认证 | `AUTH` | `AUTH.INVALID_TOKEN`, `AUTH.ACCOUNT_LOCKED` |
| 课程 | `COURSE` | `COURSE.SEATS_FULL`, `COURSE.TIME_CONFLICT` |
| 作业 | `ASSIGNMENT` | `ASSIGNMENT.DEADLINE_PASSED` |
| 成绩 | `SCORE` | `SCORE.NOT_RELEASED` |
| 审批 | `AUDIT` | `AUDIT.ALREADY_PROCESSED` |

### 2.7 追踪与日志
- 后端为每次请求生成 `traceId`；调用外部服务加挂 `x-trace-id`。
- 关键操作均记录审计日志，包含操作者、时间、对象、变更前后数据摘要。

### 2.8 文件与大对象
- 所有教学资源、提交文件存储于对象存储（OSS）；API 只返回临时访问 URL（时效 10 分钟）。
- 上传策略：先获取上传凭证，再由前端直传 OSS，回调后端确认。

## 3. 核心资源与字段

| 资源 | 主键 | 关键字段 |
| --- | --- | --- |
| User | `userId` | `username`, `email`, `role`, `status`, `statusReason`, `createdAt`, `updatedAt` |
| StudentProfile | `userId` | `studentNo`, `grade`, `major`, `className` |
| TeacherProfile | `userId` | `teacherNo`, `department`, `title`, `subjects` |
| Course | `courseId` | `name`, `semester`, `credit`, `status`, `enrollLimit`, `teacherId` |
| CourseModule | `moduleId` | `courseId`, `title`, `order`, `releaseAt` |
| CourseResource | `resourceId` | `moduleId`, `type`, `name`, `fileSize`, `downloadUrl` |
| CourseSelection | `selectionId` | `courseId`, `studentId`, `status`, `selectedAt` |
| Assignment | `assignmentId` | `courseId`, `title`, `type`, `deadline`, `allowResubmit`, `gradingRubric` |
| Submission | `submissionId` | `assignmentId`, `studentId`, `status`, `score`, `submittedAt`, `attachments`, `feedback`, `rubricScores`, `resubmitCount`, `gradingTeacherId`, `appealReason` |
| QuizAttempt | `attemptId` | `assignmentId`, `studentId`, `status`, `score`, `durationSeconds`, `startedAt`, `submittedAt`, `feedback` |
| Score | `scoreId` | `studentId`, `courseId`, `component`, `value`, `releasedAt` |
| Notification | `notificationId` | `targetType`, `title`, `channel`, `status`, `sentAt` |
| ApprovalRequest | `requestId` | `type`, `status`, `applicantId`, `payload`, `processedBy` |
| ReportJob | `jobId` | `jobType`, `status`, `createdAt`, `completedAt`, `resultUrl` |

> 说明：`QuizAttempt` 的 `answers` 字段以 JSON 数组形式持久化，元素包含 `questionId`、`answer`、`score`（可选）。

## 4. 接口分组说明

### 4.1 认证与会话（已实现）

#### POST `/api/v1/auth/login`
- **角色**：全角色
- **描述**：使用标识（用户名或邮箱）+密码登录。
- **请求体（当前实现）**
```json
{
  "identifier": "alice",        // 用户名或邮箱
  "password": "********"
}
```
- **响应体（当前实现）**
```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 3600000,          // 毫秒
  "refreshToken": "optional-refresh-token"
}
```
- **异常**：401（Invalid credentials）、403（Account is not active）

#### POST `/api/v1/auth/register`
- **角色**：公开
- **描述**：用户名/邮箱/密码注册（默认角色 Student，可传 `role`）。
- **响应体**：同登录，直接返回 `accessToken`。
- **异常**：409（Username/Email already exists）

#### GET `/api/v1/auth/me`
- **角色**：已认证
- **描述**：返回当前用户档案。
- **请求头**：`Authorization: Bearer {token}`
- **响应体（当前实现）**：
```json
{
  "id": "uuid",
  "username": "alice",
  "email": "alice@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "createdAt": "2025-11-12T08:00:00Z",
  "updatedAt": "2025-11-12T08:00:00Z"
}
```

#### POST `/api/v1/auth/refresh`
- **角色**：公开
- **描述**：使用 `refreshToken` 获取新的 `accessToken`。
- **请求体**
```json
{
  "refreshToken": "string"
}
```
- **响应体**
```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 3600000
}
```
- **异常**：401（Invalid/Expired refresh token）

（说明：登出如启用，将以 `/api/v1/auth/logout` 形式提供，作废当前 access token。）

#### GET `/actuator/health`
- **角色**：公开
- **描述**：存活/健康检查，受 Spring Boot Actuator 管理。

### 4.2 用户与角色管理

#### GET `/api/v1/users/me`
- **角色**：已认证用户
- **描述**：获取当前登录用户的完整信息，包括基本账户信息和角色对应的档案（学生档案或教师档案）。
- **响应示例**
  ```json
  {
    "traceId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "success": true,
    "data": {
      "id": "4c07ffdf-1a6a-4466-b5a2-2f6f61c3e805",
      "username": "alice",
      "email": "alice@example.com",
      "role": "STUDENT",
      "status": "ACTIVE",
      "createdAt": "2025-11-12T08:00:00Z",
      "updatedAt": "2025-11-12T08:00:00Z",
      "studentProfile": {
        "studentNo": "20250001",
        "grade": "2025",
        "major": "计算机科学",
        "className": "计科 2501"
      },
      "teacherProfile": null
    },
    "meta": null,
    "error": null
  }
  ```
- **说明**：
  - 根据用户的 `role` 字段，会返回对应的 `studentProfile` 或 `teacherProfile`（另一个为 `null`）。
  - 管理员角色（`ADMIN`）的两个 profile 字段均为 `null`。
- **异常**：`401`（未认证）。

#### PATCH `/api/v1/users/me`
- **角色**：已认证用户
- **描述**：更新当前登录用户的基本信息（用户名、邮箱）。所有字段均为可选，只更新提供的字段。
- **请求体示例**
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```
- **响应示例**：与 `GET /api/v1/users/me` 相同，返回更新后的完整用户信息。
- **校验约束**：
  - `username`：3-64 个字符，不能与现有用户名冲突
  - `email`：必须为有效邮箱格式，不能与现有邮箱冲突
- **异常**：
  - `400`：字段验证失败
  - `401`：未认证
  - `409`：用户名或邮箱已存在

#### PATCH `/api/v1/users/me/password`
- **角色**：已认证用户
- **描述**：修改当前登录用户的密码。需要提供当前密码以验证身份。
- **请求体**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```
- **校验约束**：
  - `currentPassword`：必填，用于验证身份
  - `newPassword`：必填，至少 8 个字符
  - `confirmPassword`：必填，必须与新密码一致
- **响应**：成功返回空响应（`data` 为 `null`）。
- **异常**：
  - `400`：新密码与确认密码不匹配，或字段验证失败
  - `401`：当前密码不正确或未认证

#### GET `/api/v1/users/me/preferences`
- **角色**：已认证用户
- **描述**：获取当前登录用户的偏好设置（通知偏好、隐私设置、语言等）。
- **响应示例**
  ```json
  {
    "traceId": "b4b194ad-2b90-4d32-a120-339a4d3e6e61",
    "success": true,
    "data": {
      "language": "zh-CN",
      "emailNotifications": true,
      "smsNotifications": false,
      "aiAssistantEnabled": true
    },
    "meta": null,
    "error": null
  }
  ```

#### PATCH `/api/v1/users/me/preferences`
- **角色**：已认证用户
- **描述**：更新当前登录用户的偏好设置。未传字段保持原值。
- **请求示例**
  ```json
  {
    "language": "en-US",
    "emailNotifications": false,
    "aiAssistantEnabled": true
  }
  ```
- **响应**：与 GET 相同。
- **异常**：`401`（未认证）。

#### GET `/api/v1/admin/users`
- **角色**：管理员
- **描述**：分页查询平台用户列表，支持角色、状态、关键字及教师院系筛选。响应使用统一 `ApiResponse` 包裹。
- **查询参数**
  - `page`（默认 `1`）：页码，最小值 1。
  - `pageSize`（默认 `20`，最大 `100`）：每页条数。
  - `role`：`STUDENT|TEACHER|ADMIN`。
  - `status`：`ACTIVE|LOCKED|DISABLED`。
  - `keyword`：对用户名或邮箱的模糊匹配（忽略大小写）。
  - `department`：按教师档案的院系字段筛选（忽略大小写，仅对 `TEACHER` 生效）。
  - `sort`：`field,(asc|desc)`，支持字段 `createdAt|updatedAt|username|email|role|status`，默认 `createdAt,desc`。
- **响应示例**
  ```json
  {
    "traceId": "de5f8f5e-5b08-4b74-9a8c-1e3dfd7ffd18",
    "success": true,
    "data": [
      {
        "id": "4c07ffdf-1a6a-4466-b5a2-2f6f61c3e805",
        "username": "alice",
        "email": "alice@example.com",
        "role": "STUDENT",
        "status": "ACTIVE",
        "statusReason": null,
        "createdAt": "2025-11-12T08:00:00Z",
        "updatedAt": "2025-11-12T08:00:00Z",
        "studentProfile": {
          "studentNo": "20250001",
          "grade": "2025",
          "major": "计算机科学",
          "className": "计科 2501"
        },
        "teacherProfile": null
      },
      {
        "id": "6a5d2de4-2c50-4a7a-bf3a-25841a73ca85",
        "username": "prof-zhang",
        "email": "zhang@example.com",
        "role": "TEACHER",
        "status": "LOCKED",
        "statusReason": "连续 5 次登录失败，已暂时锁定",
        "createdAt": "2025-10-01T03:00:00Z",
        "updatedAt": "2025-11-12T09:30:00Z",
        "studentProfile": null,
        "teacherProfile": {
          "teacherNo": "T2023008",
          "department": "数学学院",
          "title": "副教授",
          "subjects": [
            "线性代数",
            "高等数学"
          ]
        }
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 42,
      "sort": "createdAt,desc"
    },
    "error": null
  }
  ```
- **异常**：`403`（非管理员访问）。

#### POST `/api/v1/admin/users`
- **角色**：管理员
- **描述**：批量创建用户。支持在同一次请求中混合创建学生、教师、管理员账号。采用"先验证后创建"的策略：首先验证所有预创建用户的有效性（格式校验、唯一性校验等），如果所有用户验证通过，则统一批量创建；如果存在任何验证错误，返回所有错误信息，不创建任何用户。密码采用明文传入，后端自动加密存储。
- **请求体**
  ```json
  {
    "users": [
      {
        "username": "new-student",
        "email": "student01@example.com",
        "password": "Password#2025",
        "role": "STUDENT",
        "status": "ACTIVE",
        "studentProfile": {
          "studentNo": "20250123",
          "grade": "2025",
          "major": "软件工程",
          "className": "软工 2503"
        }
      },
      {
        "username": "new-teacher",
        "email": "teacher01@example.com",
        "password": "Teacher#2025",
        "role": "TEACHER",
        "status": "LOCKED",
        "statusReason": "入职审核中",
        "teacherProfile": {
          "teacherNo": "T2025099",
          "department": "计算机学院",
          "title": "讲师",
          "subjects": ["程序设计", "算法分析"]
        }
      }
    ]
  }
  ```
- **响应体**
  ```json
  {
    "traceId": "0ed9c9c2-5ef6-4c9f-9e53-7a9d9fb3bd4b",
    "success": true,
    "data": {
      "created": [
        {
          "id": "2afb5ed7-5f0a-4c3c-bab9-6e1f7fbd2a30",
          "username": "new-student",
          "email": "student01@example.com",
          "role": "STUDENT",
          "status": "ACTIVE",
          "statusReason": null,
          "createdAt": "2025-11-13T08:01:23Z",
          "updatedAt": "2025-11-13T08:01:23Z",
          "studentProfile": {
            "studentNo": "20250123",
            "grade": "2025",
            "major": "软件工程",
            "className": "软工 2503"
          },
          "teacherProfile": null
        }
      ],
      "errors": [
        {
          "index": 1,
          "username": "new-teacher",
          "email": "teacher01@example.com",
          "message": "Username already exists"
        }
      ]
    },
    "meta": null,
    "error": null
  }
  ```
- **状态码**
  - `201 Created`：至少成功创建一条用户。
  - `200 OK`：本次请求未创建任何新用户（`created` 为空），全部失败原因在 `errors` 中给出。
- **校验约束**
  - 同一请求中用户名/邮箱不能重复，且不得与已存在账号冲突。
  - `status` 非 `ACTIVE` 时必须提供 `statusReason`。
  - `role=STUDENT` 只能携带 `studentProfile`；`role=TEACHER` 只能携带 `teacherProfile`；`role=ADMIN` 不能携带档案信息。

#### PATCH `/api/v1/admin/users/{userId}`
- **角色**：管理员
- **描述**：更新指定用户的基本信息（用户名、邮箱、状态）。所有字段均为可选，只更新提供的字段。
- **请求体示例**
  ```json
  {
    "username": "newusername",
    "email": "newemail@example.com",
    "status": "DISABLED",
    "statusReason": "违反平台使用规范，已停用"
  }
  ```
- **响应示例**：与 `GET /api/v1/admin/users` 列表项结构相同，返回更新后的完整用户信息。
- **校验约束**：
  - `username`：3-64 个字符，不能与现有用户名冲突
  - `email`：必须为有效邮箱格式，不能与现有邮箱冲突
  - `status`：如果设置为非 `ACTIVE`，必须提供 `statusReason`
- **异常**
  - `400`：字段验证失败，或 `status` 非 `ACTIVE` 但未提供 `reason`
  - `404`：用户不存在
  - `403`：非管理员访问
  - `409`：用户名或邮箱已存在

#### PUT `/api/v1/admin/users/{userId}/status`
- **角色**：管理员
- **描述**：更新指定用户的状态，支持锁定/禁用并记录原因。
- **请求体**
  ```json
  {
    "status": "DISABLED",
    "reason": "违反平台使用规范，已停用"
  }
  ```
- **响应示例**
  ```json
  {
    "traceId": "46bf45c8-4f19-4f0e-8d18-7badc6d24718",
    "success": true,
    "data": {
      "id": "6a5d2de4-2c50-4a7a-bf3a-25841a73ca85",
      "username": "prof-zhang",
      "email": "zhang@example.com",
      "role": "TEACHER",
      "status": "DISABLED",
      "statusReason": "违反平台使用规范，已停用",
      "createdAt": "2025-10-01T03:00:00Z",
      "updatedAt": "2025-11-13T08:05:12Z",
      "studentProfile": null,
      "teacherProfile": {
        "teacherNo": "T2023008",
        "department": "数学学院",
        "title": "副教授",
        "subjects": [
          "线性代数",
          "高等数学"
        ]
      }
    },
    "meta": null,
    "error": null
  }
  ```
- **异常**
  - `400`：`status` 非 `ACTIVE` 但未提供 `reason`。
  - `404`：用户不存在。
  - `403`：非管理员访问。

### 4.3 课程与选课

课程与选课接口由 `CourseController` 暴露，统一响应结构为 `ApiResponse`。

#### GET `/api/v1/courses`
- **角色**：任意已登录用户（学生/教师/管理员）。
- **查询参数**：
  - `page`（默认 1）、`pageSize`（默认 20，最大 100）
  - `keyword`：课程名称模糊搜索（忽略大小写）
  - `teacherId`：按授课教师筛选
  - `status`：`DRAFT | PENDING_REVIEW | PUBLISHED | ARCHIVED`
  - `sort`：`field,(asc|desc)`，默认 `createdAt,desc`
- **响应数据**：`CourseResponse[]`，每个元素附带 `metrics` 指标（当前选课人数、作业数量、章节数量）。
- **说明**：分页信息写入 `meta.page / meta.pageSize / meta.total / meta.sort`。

#### GET `/api/v1/courses/plaza`
- **角色**：公开（学生登录后可查看选课状态）
- **描述**：课程广场接口，专门用于学生浏览和选课。默认只显示已发布的课程（`PUBLISHED`状态），包含教师信息和选课状态。
- **查询参数**：
  - `page`（默认 1）、`pageSize`（默认 20，最大 100）
  - `keyword`：课程名称模糊搜索（忽略大小写）
  - `semester`：按学期筛选（精确匹配）
  - `credit`：按学分筛选（精确匹配）
  - `department`：按教师院系筛选（忽略大小写，模糊匹配）
  - `sort`：`field,(asc|desc)`，支持字段 `createdAt|updatedAt|name|enrolledCount`，默认 `enrolledCount,desc`（热门课程优先）。
- **响应数据**：`CoursePlazaResponse[]`，包含以下信息：
  - 课程基本信息（id、name、semester、credit、status、enrollLimit等）
  - `enrolledCount`：当前选课人数
  - `assignments`：作业数量
  - `modules`：章节数量
  - `teacher`：教师信息（id、username、department、title）
  - `enrollmentStatus`：选课状态（仅当学生已登录时返回）
    - `enrolled`：是否已选课
    - `canEnroll`：是否可以选课
    - `reason`：如果不能选课，说明原因（如"课程名额已满"、"课程未开放选课"）
- **响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": "7f7d5669-20e5-4f84-b897-17c1cfe5a1c0",
      "name": "数据结构与算法",
      "semester": "2025-春季",
      "credit": 4,
      "status": "PUBLISHED",
      "enrollLimit": 50,
      "enrolledCount": 35,
      "assignments": 8,
      "modules": 12,
      "teacher": {
        "id": "53d5f8f4-136f-4a73-9bde-d3f7f4b0f1ed",
        "username": "prof-zhang",
        "department": "计算机学院",
        "title": "教授"
      },
      "enrollmentStatus": {
        "enrolled": false,
        "canEnroll": true,
        "reason": null
      },
      "createdAt": "2025-01-15T08:00:00Z",
      "updatedAt": "2025-01-20T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "sort": "enrolledCount,desc"
  }
}
```
- **业务规则**
  - 只返回 `PUBLISHED` 状态的课程
  - 如果学生已登录，会显示该学生的选课状态
  - 按选课人数排序时，会在内存中排序（因为这是计算字段）
  - 如果课程名额已满，`canEnroll` 为 `false`，`reason` 为 "课程名额已满"

#### GET `/api/v1/courses/{courseId}`
- **角色**：任意已登录用户。
- **响应数据**：单个 `CourseResponse`。
- **异常**：`404`（课程不存在）。

#### POST `/api/v1/courses`
- **角色**：`TEACHER` / `ADMIN`。
- **请求体示例**：
  ```json
  {
    "name": "高级算法设计",
    "semester": "2025春",
    "credit": 3,
    "enrollLimit": 80,
    "teacherId": "（管理员代创建时可指定）"
  }
  ```
- 登录教师不传 `teacherId` 时自动绑定为课程教师，初始状态 `DRAFT`。
- **响应**：201 Created，返回新建 `CourseResponse`。

#### PUT `/api/v1/courses/{courseId}`
- **角色**：课程教师或管理员。
- **允许字段**：`name`、`semester`、`credit`、`enrollLimit`（均为可选字段，未提供则不变）。
- **异常**：
  - `404`：课程不存在。
  - `403`：非课程教师且非管理员。

#### POST `/api/v1/courses/{courseId}/publish`
- **角色**：课程教师或管理员。
- 将课程状态设为 `PENDING_REVIEW` 并写入一条 `ApprovalRequest(type=COURSE_PUBLISH)`。
- **响应体**（`CoursePublishResponse`）：
  ```json
  {
    "courseId": "uuid",
    "status": "PENDING_REVIEW",
    "approvalRequestId": "uuid",
    "submittedAt": "2025-11-12T08:00:00Z"
  }
  ```

#### POST `/api/v1/courses/{courseId}/enroll`
- **角色**：`STUDENT`。
- 仅支持对 `PUBLISHED` 状态课程选课；容量由 `enrollLimit` 限制，达到上限返回 `409`。
- **响应体**（`CourseEnrollmentResponse`）：
  ```json
  {
    "selectionId": "uuid",
    "courseId": "uuid",
    "studentId": "uuid",
    "status": "ENROLLED",
    "selectedAt": "2025-11-12T08:00:00Z"
  }
  ```
- **异常**：
  - `404`：课程不存在。
  - `409`：课程未开放、名额已满或重复选课。

#### DELETE `/api/v1/courses/{courseId}/enroll`
- **角色**：`STUDENT`。
- 将选课状态从 `ENROLLED` 变为 `DROPPED`；非激活状态退课返回 `409`。
- **异常**：
  - `404`：当前学生未选该课。
  - `409`：选课状态并非 `ENROLLED`。

#### GET `/api/v1/courses/{courseId}/students`
- **角色**：`TEACHER`（课程教师） / `ADMIN`。
- **描述**：获取指定课程的选课学生列表。
- **响应数据**：`CourseStudentResponse[]`。
  ```json
  {
    "studentId": "uuid",
    "username": "alice",
    "email": "alice@example.com",
    "status": "ENROLLED",
    "enrolledAt": "2025-11-12T08:00:00Z"
  }
  ```
- **异常**：
  - `404`：课程不存在。
  - `403`：非课程教师或管理员。

#### GET `/api/v1/students/{studentId}/courses`
- **角色**：本人或 `TEACHER` / `ADMIN`。
- **响应数据**：`StudentCourseResponse[]`，包含选课状态及作业完成情况：
  ```json
  {
    "courseId": "uuid",
    "name": "高级算法设计",
    "status": "PUBLISHED",
    "selectionStatus": "ENROLLED",
    "selectedAt": "2025-11-12T08:00:00Z",
    "pendingAssignments": 2,
    "completedAssignments": 3,
    "totalAssignments": 5
  }
  ```
- 作业统计来源于课程作业总数与学生最新一次提交的评分状态。

#### GET `/api/v1/courses/{courseId}/analytics/overview`
- **角色**：当前任意已登录用户（后续版本可限制为授课教师/管理员）。
- **响应体**：`CourseAnalyticsResponse`，`completionRate` 基于已评分提交占比，其余列表字段目前返回空数组（预留扩展位）。

### 4.4 学习模块与资源

#### 4.4.1 数据模型与资源类型

- `CourseModule`
  - `id`：UUID
  - `courseId`：UUID，所属课程
  - `title`：章节名称（最长 128 字符）
  - `displayOrder`：章节排序，从 1 开始；用于前端按顺序展示
  - `releaseAt`：发布时间（可为空，空表示立即对选课学生可见）
- `CourseResource`
  - `id`：UUID
  - `moduleId`：归属章节
  - `type`：`VIDEO | PDF | LINK | OTHER`
  - `name`：资源名称（最长 128 字符）
  - `fileSize`：文件大小（字节，可选；资源类型为链接时一般为空）
  - `downloadUrl`：访问/下载地址（最长 2048 字符；视频等静态资源为 OSS 回调写入的临时地址）

#### GET `/api/v1/courses/{courseId}/modules`
- **角色**：学生 / 教师 / 管理员（仅要求已登录）
- **描述**：按 `displayOrder` 升序返回课程章节及已登记资源。
- **路径参数**：`courseId`（UUID）
- **响应体**
```json
{
  "traceId": "af3f6d84-4c47-4f77-8e0a-4f4a1fd5d205",
  "success": true,
  "data": [
    {
      "id": "8f0bf705-6e6a-4a5d-a07f-8ce5f7c218d9",
      "courseId": "c2a8af3a-52f9-4a66-bf93-6e6eda34ba75",
      "title": "第 1 周 · 函数式编程导论",
      "displayOrder": 1,
      "releaseAt": "2025-08-26T00:00:00Z",
      "resources": [
        {
          "id": "9e8d1b01-1d9a-4f55-94bc-14e3a6a33041",
          "type": "VIDEO",
          "name": "导论录播",
          "fileSize": 734003200,
          "downloadUrl": "https://oss.c3po.local/tmp/9e8d1b01.mp4"
        }
      ]
    }
  ],
  "meta": null,
  "error": null
}
```
- **错误码**：`404` 当课程不存在。

#### POST `/api/v1/courses/{courseId}/modules`
- **角色**：教师（课程负责人） / 管理员
- **描述**：为课程创建新章节。后端会校验教师是否为当前课程负责人；管理员不受限制。
- **路径参数**：`courseId`（UUID）
- **请求体**
```json
{
  "title": "第 3 周 · 闭包与惰性求值",
  "displayOrder": 3,
  "releaseAt": "2025-09-09T00:00:00Z"
}
```
  - 校验约束：
    - `title` 必填，长度 ≤ 128
    - `displayOrder` 必填，整数 ≥ 1
    - `releaseAt` 可选，ISO8601 时间戳
- **成功响应**
```json
{
  "traceId": "0ed9c9c2-5ef6-4c9f-9e53-7a9d9fb3bd4b",
  "success": true,
  "data": {
    "id": "f1ce1f14-1d36-46be-8e37-0c6de6cdf01f",
    "courseId": "c2a8af3a-52f9-4a66-bf93-6e6eda34ba75",
    "title": "第 3 周 · 闭包与惰性求值",
    "displayOrder": 3,
    "releaseAt": "2025-09-09T00:00:00Z",
    "resources": []
  },
  "meta": null,
  "error": null
}
```
- **错误码**：
  - `404`：课程不存在
  - `403`：当前教师不是课程负责人

#### POST `/api/v1/modules/{moduleId}/resources/upload-url`
- **角色**：教师 / 管理员
- **描述**：为指定章节申请临时直传凭证，供前端将大体量文件直传 OSS。当前实现仅验证章节存在，未校验章节归属教师。
- **路径参数**：`moduleId`（UUID）
- **响应体**
```json
{
  "traceId": "46bf45c8-4f19-4f0e-8d18-7badc6d24718",
  "success": true,
  "data": {
    "uploadUrl": "https://oss.c3po.local/upload/46bf45c8-4f19-4f0e-8d18-7badc6d24718",
    "method": "PUT",
    "expiresAt": "2025-11-13T08:10:00Z",
    "callbackUrl": "/api/v1/modules/46bf45c8-4f19-4f0e-8d18-7badc6d24718/resources"
  },
  "meta": null,
  "error": null
}
```
- **错误码**：`404` 当章节不存在。
- **备注**：上传完成后需使用下述 “确认资源信息” 接口落库；否则模块中不会出现该资源。

#### POST `/api/v1/modules/{moduleId}/resources`
- **角色**：教师（课程负责人） / 管理员
- **描述**：在章节下登记一个资源条目，通常在文件上传完成后调用，也可用于录入外部链接。
- **路径参数**：`moduleId`（UUID）
- **请求体**
```json
{
  "type": "PDF",
  "name": "闭包讲义",
  "fileSize": 5242880,
  "downloadUrl": "https://oss.c3po.local/exports/fp-week3.pdf"
}
```
  - 校验约束：
    - `type` 必填，取值见 4.4.1
    - `name` 必填，长度 ≤ 128
    - `fileSize` 可选，数值型；如传入将用于展示文件体积
    - `downloadUrl` 可选；当资源为 `LINK` 时通常填写外部地址
- **成功响应**
```json
{
  "traceId": "f9cd8e0c-ef6c-4b2e-b8ea-2f8cc9c3f836",
  "success": true,
  "data": {
    "id": "5b8e9e4a-3d2a-4ad7-8e3e-1f5c9a0d0a0c",
    "moduleId": "f1ce1f14-1d36-46be-8e37-0c6de6cdf01f",
    "type": "PDF",
    "name": "闭包讲义",
    "fileSize": 5242880,
    "downloadUrl": "https://oss.c3po.local/exports/fp-week3.pdf",
    "createdAt": "2025-11-13T08:01:23Z",
    "updatedAt": "2025-11-13T08:01:23Z"
  },
  "meta": null,
  "error": null
}
```
- **错误码**：
  - `404`：章节或课程不存在
  - `403`：当前教师非课程负责人

#### GET `/api/v1/resources/{resourceId}`
- **角色**：学生 / 教师 / 管理员
- **描述**：获取单个资源元数据及当前临时访问地址。
- **路径参数**：`resourceId`（UUID）
- **响应体**：与上文资源登记接口返回结构一致。
- **错误码**：`404` 当资源不存在。
- **备注**：若资源需刷新临时地址，应重新上传或由后台任务更新 `downloadUrl`。

### 4.5 作业与测验

#### GET `/api/v1/courses/{courseId}/assignments`
- 返回作业/测验列表，附提交率、逾期率。

#### POST `/api/v1/courses/{courseId}/assignments`
- **角色**：教师
- 创建作业或测验，关键字段：
- `type` 可选值：`ASSIGNMENT`、`QUIZ`、`PROJECT`（默认 `ASSIGNMENT`）。
- `visibility.visibleTo` 将写入 `Assignment.visibilityTags`，用于控制班级/分组可见性。
```json
{
  "title": "函数式编程作业",
  "type": "ASSIGNMENT",
  "deadline": "2025-09-12T15:00:00+08:00",
  "allowResubmit": true,
  "maxResubmit": 3,
  "gradingRubric": [
    {"criterion": "正确性", "weight": 0.5},
    {"criterion": "代码规范", "weight": 0.3},
    {"criterion": "创新性", "weight": 0.2}
  ],
  "visibility": {
    "releaseAt": "2025-09-01T09:00:00+08:00",
    "visibleTo": ["class-A", "class-B"]
  }
}
```

#### GET `/api/v1/assignments/{assignmentId}`
- 作业详情、说明文件、评分尺度。

#### PATCH `/api/v1/assignments/{assignmentId}`
- 更新作业；若截止时间修改，需通知已发布学生。

#### POST `/api/v1/assignments/{assignmentId}/publish`
- 发布作业并触发通知。

#### POST `/api/v1/assignments/{assignmentId}/duplicate`
- 复制作业到其他课程或学期。

### 4.6 学生提交、测验尝试与批改

**数据结构**
- `SubmissionResponse`
  - `id`, `assignmentId`, `studentId`
  - `status`: `SUBMITTED|RESUBMITTED|GRADED|APPEALED`
  - `score`（0-100，可为空）、`feedback`（≤4096）
  - `attachments`: string[]，长度 ≤ 10、元素 ≤ 2048
  - `rubricScores`: `{criterion, score}` 数组
  - `resubmitCount`: 已重提次数（首次提交为 0）
  - `gradingTeacherId`: 最近评分教师
  - `appealReason` / `appealedAt`
  - `submittedAt`、`createdAt`、`updatedAt`

#### GET `/api/v1/assignments/{assignmentId}/submissions`
- **角色**：教师 / 管理员
- **描述**：查看指定作业的所有学生提交，返回 `SubmissionResponse[]`。
- **响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": "7f7d5669-20e5-4f84-b897-17c1cfe5a1c0",
      "studentId": "53d5f8f4-136f-4a73-9bde-d3f7f4b0f1ed",
      "status": "GRADED",
      "score": 92,
      "resubmitCount": 1,
      "submittedAt": "2025-11-12T09:30:00Z"
      // ... 其余字段略
    }
  ],
  "meta": null,
  "error": null
}
```
- **错误码**：`404` 作业不存在；`403` 非课程负责人访问。

#### GET `/api/v1/students/{studentId}/submissions`
- **角色**：学生（仅本人）、教师（仅限自己负责课程的提交）、管理员。
- **描述**：按学生维度查看所有提交记录；若提交不再关联有效课程将被自动过滤。响应为 `SubmissionResponse[]`。
- **错误码**：`403` 非法访问。

#### POST `/api/v1/assignments/{assignmentId}/submissions`
- **角色**：学生
- **请求体**
```json
{
  "attachments": [
    "https://oss.smart-learning.edu/tmp/submission-1.zip"
  ]
}
```
- **业务规则**
  - 作业必须已发布且已到达 `releaseAt`。
  - 必须在截止时间（`deadline`）之前提交。
  - 每个学生仅能创建一次提交（后续使用 PUT 重提）。
  - 校验附件数组长度 ≤ 10，单个链接 ≤ 2048 字符。
- **响应**：201 Created，返回 `SubmissionResponse`。
- **错误码**：`404` 作业不存在；`409` 作业未开放、已过截止或重复提交。

#### PUT `/api/v1/submissions/{submissionId}`
- **角色**：学生（提交者本人）
- **描述**：在截止前重提附件或补充说明。
- **业务规则**
  - 仅当作业允许重提（`allowResubmit=true`）时方可调用。
  - 受 `maxResubmit` 限制，超过后返回 `409`。
  - 自动递增 `resubmitCount`，清空已发布成绩与批注。
  - 重提同样受发布时间与截止时间约束。

#### GET `/api/v1/submissions/{submissionId}`
- **角色**：提交者本人、授课教师、管理员。
- **描述**：返回单个 `SubmissionResponse`，包含评分与 Rubric。
- **错误码**：`404` 提交不存在；`403` 未授权访问。

#### POST `/api/v1/submissions/{submissionId}/grade`
- **角色**：教师 / 管理员
- **请求体**
```json
{
  "score": 86,
  "rubricScores": [
    {"criterion": "正确性", "score": 45},
    {"criterion": "代码规范", "score": 26},
    {"criterion": "创新性", "score": 15}
  ],
  "feedback": "整体表现不错，注意异常处理。",
  "publish": true
}
```
- **业务规则**
  - `score` 范围 0-100；`rubricScores` 可为空。
  - `publish=false` 时仅保存草稿，不修改提交状态。
  - 提交评分后清理历史申诉状态，`publish=true` 时状态改为 `GRADED`。

#### POST `/api/v1/assignments/{assignmentId}/submissions/batch-grade`
- **角色**：教师 / 管理员
- **描述**：批量对指定作业的多个提交进行评分，适用于一次性批改多个学生作业的场景。
- **请求体**
```json
{
  "grades": [
    {
      "submissionId": "7f7d5669-20e5-4f84-b897-17c1cfe5a1c0",
      "score": 92,
      "rubricScores": [
        {"criterion": "正确性", "score": 50},
        {"criterion": "代码规范", "score": 28},
        {"criterion": "创新性", "score": 14}
      ],
      "feedback": "代码质量很高，逻辑清晰。",
      "publish": true
    },
    {
      "submissionId": "8a8e6770-31f6-5g95-c908-28d2dgf6b2d1",
      "score": 78,
      "rubricScores": [
        {"criterion": "正确性", "score": 40},
        {"criterion": "代码规范", "score": 25},
        {"criterion": "创新性", "score": 13}
      ],
      "feedback": "基本功能实现正确，但代码注释较少。",
      "publish": true
    }
  ]
}
```
- **业务规则**
  - `grades` 数组不能为空，至少包含一个评分项。
  - 每个评分项的 `submissionId` 必须存在且属于指定的 `assignmentId`。
  - `score` 范围 0-100；`rubricScores` 可为空。
  - `publish=false` 时仅保存草稿，不修改提交状态；`publish=true` 时状态改为 `GRADED`。
  - 批量评分后清理所有提交的历史申诉状态。
  - 如果存在无效的 `submissionId` 或提交不属于指定作业，返回 `400 Bad Request`。
- **响应**：返回 `SubmissionResponse[]`，包含所有已评分的提交信息。
- **错误码**：`404` 作业不存在；`403` 非课程负责人访问；`400` 请求参数无效（提交不存在或不属于指定作业）。

#### POST `/api/v1/submissions/{submissionId}/appeal`
- **角色**：学生（提交者本人）
- **请求体**
```json
{
  "reason": "评分标准未对创新点给予加分，申请复核。"
}
```
- **业务规则**
  - 仅对已发布成绩的提交允许申诉，且每份提交仅能申诉一次。
  - 申诉成功后状态变为 `APPEALED`，记录 `appealReason` 与时间戳。

#### POST `/api/v1/submissions/{submissionId}/ai-review`
- **状态**：规划中（当前版本返回 404，占位接口）。

#### POST `/api/v1/assignments/{assignmentId}/quiz-attempts`
- **角色**：学生
- **描述**：针对 `type=QUIZ` 的作业创建测验尝试。若缺省 `submittedAt`，系统记录为草稿（`status=IN_PROGRESS`）；填写则表示立即交卷（`status=SUBMITTED`）。
- **请求体（示例）**
```json
{
  "startedAt": "2025-09-10T08:00:00Z",
  "submittedAt": "2025-09-10T08:25:00Z",
  "durationSeconds": 1500,
  "answers": [
    {"questionId": "Q1", "answer": "B"},
    {"questionId": "Q2", "answer": "lambda 表达式", "score": 5}
  ]
}
```

#### PUT `/api/v1/quiz-attempts/{attemptId}`
- **角色**：学生
- **描述**：更新测验作答或交卷状态；`submit=true` 会在未显式提供 `submittedAt` 时使用服务器当前时间交卷。
- **请求体（示例）**
```json
{
  "answers": [
    {"questionId": "Q1", "answer": "B"},
    {"questionId": "Q2", "answer": "lambda 表达式"}
  ],
  "submit": true
}
```

#### GET `/api/v1/assignments/{assignmentId}/quiz-attempts`
- **角色**：教师 / 管理员
- **描述**：列出测验下的全部尝试（返回 `QuizAttemptResponse` 列表）。

#### GET `/api/v1/assignments/{assignmentId}/quiz-attempts/me`
- **角色**：学生
- **描述**：查看本人在该测验下的全部尝试记录。

#### GET `/api/v1/quiz-attempts/{attemptId}`
- **角色**：学生（本人）/教师/管理员
- **描述**：查询单个测验尝试详情；教师需具备课程管理权限。

#### POST `/api/v1/quiz-attempts/{attemptId}/grade`
- **角色**：教师 / 管理员
- **描述**：登记测验得分与点评，状态自动切换为 `GRADED`。
- **请求体（示例）**
```json
{
  "score": 85,
  "feedback": "第 2 题推导过程需要补充。"
}
```

> `QuizAttemptResponse` 字段概要：`status`（`IN_PROGRESS`/`SUBMITTED`/`GRADED`/`CANCELLED`/`EXPIRED`）、`durationSeconds`、`answers`（题目作答明细）、`feedback`、`startedAt`/`submittedAt`、`score`。

### 4.7 成绩与学习分析

#### GET `/api/v1/students/{studentId}/scores`
- **角色**：学生本人、教师、管理员（会自动校验权限）
- **描述**：同时返回成绩明细、综合概览、学习趋势以及异步导出建议。
- **响应体（节选）**
```json
{
  "traceId": "8b1f...",
  "success": true,
  "data": {
    "studentId": "2b01...",
    "items": [
      {
        "id": "91ac...",
        "courseId": "c001...",
        "component": "MIDTERM",
        "value": 86,
        "releasedAt": "2025-10-12T03:00:00Z"
      }
    ],
    "summary": {
      "overallAverage": 82.5,
      "median": 84,
      "gpa": 3.25,
      "progress": {
        "totalCourses": 3,
        "totalAssignments": 12,
        "completedAssignments": 10,
        "gradedAssignments": 8,
        "overdueAssignments": 1
      },
      "courses": [
        {
          "courseId": "c001...",
          "courseName": "函数式编程",
          "average": 85.6,
          "highest": 95,
          "lowest": 72,
          "scoreCount": 4,
          "componentAverages": {
            "MIDTERM": 86,
            "FINAL": 84
          },
          "progress": {
            "totalAssignments": 5,
            "completedAssignments": 5,
            "gradedAssignments": 4,
            "overdueAssignments": 0
          }
        }
      ],
      "insights": [
        "整体成绩稳健，可进一步冲刺高分。",
        "存在未按时完成的作业，请优先补齐。"
      ]
    },
    "trend": [
      {
        "courseName": "函数式编程",
        "component": "MIDTERM",
        "value": 86,
        "timestamp": "2025-10-12T03:00:00Z"
      }
    ],
    "exportInfo": {
      "available": true,
      "suggestedJobType": "SCORE_EXPORT",
      "suggestedParams": {
        "studentId": "2b01...",
        "courseIds": ["c001...", "c002..."]
      },
      "instructions": "调用 POST /api/v1/jobs/reports 并传入建议参数即可生成成绩导出任务。"
    }
  }
}
```

#### GET `/api/v1/courses/{courseId}/scores`
- **角色**：教师/管理员
- **查询参数**：
  - `component`（可选）：仅返回指定成绩构成
  - `studentId`（可选）：聚焦单个学生
- **响应体要点**：
  - `overview`：总体均分、最高/最低分、覆盖学生数、完成率
  - `distribution`：自动分桶（0-59 / 60-69 / 70-79 / 80-89 / 90-100）
  - `componentAverages`：各构成平均分
  - `topPerformers`、`needsAttention`：高分/风险学生列表（UUID）

#### POST `/api/v1/courses/{courseId}/scores/publish`
- 批量发布成绩；可设置发布时间（立即或预约），重复发布会自动覆盖同一构成。

#### GET `/api/v1/courses/{courseId}/analytics/overview`
- **描述**：教学仪表盘核心指标，结合选课、作业、成绩计算滞后名单、难度系数等。
- **响应体字段**：
  - `completionRate`：已批改作业数 /（选课人数 × 作业总数）
  - `averageScore` / `medianScore`：综合成绩均值、位于中位的得分
  - `enrolledStudents`、`totalAssignments`、`gradedSubmissions`、`pendingSubmissions`
  - `overdueStudents`：存在逾期或延迟提交的学生 UUID
  - `difficultAssignments`：平均得分 < 60 或逾期严重的作业标题
  - `atRiskStudents`：成绩偏低或缺交较多的学生 UUID
  - `insights`：自动生成的教学建议摘要

#### POST `/api/v1/analytics/reminders`
- 对滞后学生批量发送提醒，可指定渠道。

### 4.8 消息、待办与 AI 助手

#### 4.8.1 消息通知

##### GET `/api/v1/notifications`
- **角色**：已认证用户（`ROLE_STUDENT|ROLE_TEACHER|ROLE_ADMIN`），按创建时间倒序返回当前可见的通知。
- **查询参数**
  - `page`（默认 `1`）：页码，最小值 1。
  - `pageSize`（默认 `20`，最大 `100`）：每页条数。
  - `targetType`：通知面向的目标类型（如 `announcement`、`reminder`、`system`），大小写不敏感。
  - `status`：通知状态，取值来自 `NotificationStatus = {DRAFT,SCHEDULED,SENT,FAILED}`。
- **响应体**
  - 返回统一 `ApiResponse` 包裹结构（`traceId/success/data/meta/error`），`data` 为 `NotificationResponse[]`。
  - `NotificationResponse` 字段：
    - `id`: UUID
    - `targetType`: string ≤ 32
    - `title`: string ≤ 128
    - `content`: string ≤ 4096
    - `sendChannels`: `NotificationChannel[]`（`INBOX|EMAIL|SMS`）
    - `status`: `NotificationStatus`
    - `sentAt`: ISO8601，通知真正发送时间（仅在 `SENT` 时有值）
    - `createdAt` / `updatedAt`: ISO8601
- **示例响应**
```json
{
  "traceId": "5da6c4cf-21f8-4f34-94e9-5dd32b49d1cb",
  "success": true,
  "data": [
    {
      "id": "4c07ffdf-1a6a-4466-b5a2-2f6f61c3e805",
      "targetType": "announcement",
      "title": "课程发布提醒",
      "content": "《函数式编程》将于今晚 20:00 发布新章节。",
      "sendChannels": ["INBOX", "EMAIL"],
      "status": "SENT",
      "sentAt": "2025-11-13T08:00:13Z",
      "createdAt": "2025-11-13T07:59:50Z",
      "updatedAt": "2025-11-13T08:00:13Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 12,
    "sort": "createdAt,desc"
  },
  "error": null
}
```

##### POST `/api/v1/notifications`
- **角色**：`ROLE_TEACHER` 或 `ROLE_ADMIN`。
- **描述**：创建并立即发送一条通知：保存记录、标记状态为 `SENT`，写入 `sentAt`。
- **请求体验证**
  - `targetType`：必填，string，长度 ≤ 32。
  - `title`：必填，string，长度 ≤ 128。
  - `content`：必填，string，长度 ≤ 4096。
  - `sendChannels`：必填，数组，元素取值 `INBOX|EMAIL|SMS`，至少 1 个。
- **成功响应**：201 Created，返回新增的 `NotificationResponse`。
- **异常**
  - `400`：请求体验证失败（字段为空、长度超限、渠道列表为空等）。
  - `403`：无权限的角色尝试调用。

#### 4.8.2 待办事项

##### GET `/api/v1/todos`
- **角色**：已认证用户；根据当前登录用户的 `UserRole` 返回对应待办。
- **业务规则**
  - 学生 (`ROLE_STUDENT`)：遍历已选课程，筛选未评分/未提交的作业，返回 `type=assignment`、`status=pending|submitted` 待办。
  - 教师 (`ROLE_TEACHER`)：统计负责课程中待批改的提交，返回 `type=grading` 待办，并附带 `description = 待批改提交数`。
  - 管理员 (`ROLE_ADMIN`)：统计审批中心 `PENDING` 数量，返回 `type=approval` 待办；若无待审批则返回空列表。
- **响应字段（`TodoResponse`）**
  - `id`: UUID（运行时生成，非持久化 ID）
  - `type`: string（`assignment|grading|approval|...`）
  - `title`: string
  - `description`: string，可为空
  - `dueAt`: ISO8601，关联截止时间（如作业截止）
  - `status`: string（`pending|submitted|completed` 等）
- **示例响应**
```json
{
  "traceId": "2f9db2d0-1e23-4ec1-8cf6-17b2dc9369af",
  "success": true,
  "data": [
    {
      "id": "6a5d2de4-2c50-4a7a-bf3a-25841a73ca85",
      "type": "assignment",
      "title": "提交作业：函数式编程作业",
      "description": "课程 ID: C2A8AF3A",
      "dueAt": "2025-09-12T15:00:00Z",
      "status": "pending"
    }
  ],
  "meta": null,
  "error": null
}
```

#### 4.8.3 AI 助手对话

##### POST `/api/v1/assistant/chat`
- **角色**：默认校验需登录；后续可结合用户偏好（`/api/v1/users/me/preferences`) 中的 `aiAssistantEnabled` 开关。
- **描述**：基于课程上下文、历史对话为学生/教师提供智能辅学回答。接口支持两种响应模式：
  1. **JSON 模式**：返回完整回答及推荐的下一步操作。
  2. **SSE 流式模式**：通过 `Content-Type: text/event-stream` 推送增量消息，字段 `event`=`message`/`complete`。
- **请求体**
  - `context`：可选，包含 `courseId`、`moduleId`、`studentId` 等上下文，有助于限定知识范围。
  - `messages`：必填，会话消息列表（按时间排序），`role` 仅支持 `system|assistant|student|teacher`。
  - `preferences`：可选，控制语言、风格、最大响应长度、是否附带参考资料等。
- **JSON 成功响应（规划中，v1.1 引入）**
```json
{
  "traceId": "c1f23b19-8744-4f7a-86d1-51bd2645df06",
  "success": true,
  "data": {
    "conversationId": "conv-20251113-0001",
    "answer": "函数式编程强调函数是第一类公民，核心特点包括......",
    "references": [
      {"type": "module", "id": "M003", "title": "第 3 周 · 闭包与惰性求值"}
    ],
    "suggestions": [
      {"action": "open_resource", "target": "M003-R02"},
      {"action": "practice_quiz", "target": "assignment-quiz-09"}
    ]
  },
  "meta": null,
  "error": null
}
```
- **SSE 事件格式**
  - `event: message\ndata: {"content": "..."}`
  - `event: metadata\ndata: {"references":[...]}`（可选）
  - `event: complete\ndata: {"conversationId": "...", "usage": {"promptTokens": 123, "completionTokens": 456}}`
- **异常**
  - `400`：上下文不合法（缺失必须字段、消息序列为空）。
  - `403`：用户未开启 AI 助手或超出使用配额。
  - `503`：AI 模型服务不可用（透传后端 `Retry-After`）。


### 4.9 管理员审批与系统设置

#### 4.9.1 审批池查询
- **GET** `/api/v1/admin/approvals`
- **角色**：管理员 (`ROLE_ADMIN`)
- **描述**：分页查询审批池，支持状态与类型过滤。返回值沿用统一响应包装（`data` 为审批项数组，`meta` 为分页信息）。
- **查询参数**：
  - `status`：`PENDING|APPROVED|REJECTED`，默认全部。
  - `type`：`COURSE_PUBLISH|COURSE_DROP_AFTER_DEADLINE|SCORE_APPEAL`。
  - `page`：默认 1；`pageSize`：默认 20，最大 100。
- **响应示例**
```json
{
  "traceId": "fd1a5c95-2af9-4f1c-91f5-1d3ce85fbbe2",
  "success": true,
  "data": [
    {
      "id": "d6f8f2d9-1f93-4a4a-8d0a-4be4fb1715f3",
      "type": "COURSE_PUBLISH",
      "status": "PENDING",
      "applicantId": "7a1c4f33-f9dd-4dd5-8f1a-83cb3b8d6f47",
      "payload": "{\"courseId\":\"c2a8af3a-52f9-4a66-bf93-6e6eda34ba75\"}",
      "processedBy": null,
      "comment": null,
      "processedAt": null,
      "createdAt": "2025-11-13T07:58:00Z",
      "updatedAt": "2025-11-13T07:58:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 3,
    "sort": "createdAt,desc"
  },
  "error": null
}
```

#### 4.9.2 审批决策
- **POST** `/api/v1/admin/approvals/{requestId}/decision`
- **角色**：管理员
- **描述**：对指定审批单执行通过或驳回操作；系统自动记录处理人和时间戳。
- **请求体**
```json
{
  "status": "APPROVED",                 // 必填：APPROVED 或 REJECTED；禁止传 PENDING
  "comment": "检查完毕，允许发布"         // 可选，最大 1024 字符；驳回时建议填写
}
```
- **响应体**：返回更新后的审批单（结构同查询）。
- **错误码**：`404`（未找到审批单）、`400`（状态非法）、`403`（非管理员）。

#### 4.9.3 平台运行指标
- **GET** `/api/v1/admin/metrics`
- 汇总用户总数、课程总数、已发布课程数、作业总数与待审批事项数量，用于后台仪表盘展示。

#### 4.9.4 系统设置管理
- **GET** `/api/v1/admin/system/settings`
  - **描述**：读取当前平台全局设置。系统保证存在一条配置记录，若尚未初始化将返回默认值。
  - **响应示例**
```json
{
  "traceId": "5c7e0a31-71a4-46a8-8a34-77c3a0baf4aa",
  "success": true,
  "data": {
    "maintenanceWindow": {
      "enabled": false,
      "startAt": null,
      "endAt": null,
      "message": null
    },
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireNumber": true,
      "requireSpecial": false,
      "expiryDays": null
    },
    "alertThresholds": {
      "loginFailure": 5,
      "storageUsagePercent": 80,
      "jobQueueDelayMinutes": 10
    }
  },
  "meta": null,
  "error": null
}
```
- **PUT** `/api/v1/admin/system/settings`
  - **描述**：按需覆盖上述字段，未提供的字段维持原值。`maintenanceWindow.startAt` 需早于 `maintenanceWindow.endAt`；数字阈值范围见校验约束。
  - **请求示例**
```json
{
  "maintenanceWindow": {
    "enabled": true,
    "startAt": "2025-11-20T14:00:00Z",
    "endAt": "2025-11-20T16:00:00Z",
    "message": "系统维护中，请稍后再试"
  },
  "passwordPolicy": {
    "minLength": 10,
    "requireUppercase": true,
    "requireNumber": true,
    "requireSpecial": true,
    "expiryDays": 90
  },
  "alertThresholds": {
    "loginFailure": 8,
    "storageUsagePercent": 85,
    "jobQueueDelayMinutes": 15
  }
}
```
- **错误码**：`400`（维护窗口时间顺序错误或数值超出允许范围）、`403`（非管理员）。

> 注：审计日志查询接口仍在规划阶段，将于权限细粒度改造后一并交付。

### 4.10 Dashboard 仪表板接口

Dashboard 接口用于管理员前端展示平台概览数据和统计信息。

#### GET `/api/v1/dashboard/overview`
- **角色**：已认证用户（推荐管理员使用）
- **描述**：获取 Dashboard 概览数据，包括总成员数、活跃成员数、活动总数和待审批申请数。
- **响应示例**
```json
{
  "traceId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "success": true,
  "data": {
    "totalMembers": 125,
    "activeMembers": 89,
    "totalActivities": 42,
    "pendingApplications": 7
  },
  "meta": null,
  "error": null
}
```

#### GET `/api/v1/dashboard/recent-activities`
- **角色**：已认证用户
- **描述**：获取最近活动概览数据，包括累计活动数、活跃成员数和审批通过率。
- **响应示例**
```json
{
  "traceId": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "success": true,
  "data": {
    "totalActivities": 42,
    "activeMembers": 89,
    "approvalRate": 85.0
  },
  "meta": null,
  "error": null
}
```
- **说明**：`approvalRate` 为百分比数值（0-100），计算方式为：已批准申请数 / 总申请数 × 100

#### GET `/api/v1/dashboard/pending-tasks`
- **角色**：已认证用户
- **描述**：获取待处理任务数据，包括待审批申请数、活动数据总览和成员活跃情况。
- **响应示例**
```json
{
  "traceId": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
  "success": true,
  "data": {
    "pendingApplications": 7,
    "activityCount": 42,
    "activeMembers": 89,
    "totalMembers": 125
  },
  "meta": null,
  "error": null
}
```

#### GET `/api/v1/dashboard/usage-trend`
- **角色**：已认证用户
- **描述**：获取平台使用率趋势数据（最近N天），包括活跃用户、课程访问和作业提交的趋势。
- **查询参数**
  - `days`（可选，默认 `7`）：查询最近多少天的数据，范围 1-30。
- **响应示例**
```json
{
  "traceId": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
  "success": true,
  "data": {
    "dates": ["2025-11-13", "2025-11-14", "2025-11-15", "2025-11-16", "2025-11-17", "2025-11-18", "2025-11-19"],
    "activeUsers": [65.0, 67.5, 70.0, 72.5, 75.0, 70.0, 65.0],
    "courseVisits": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "assignmentSubmissions": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
  },
  "meta": null,
  "error": null
}
```
- **说明**：
  - `dates`：日期列表，格式为 `YYYY-MM-DD`
  - `activeUsers`：每日活跃用户百分比（0-100），当前为模拟数据
  - `courseVisits`：每日课程访问百分比（0-100），当前为模拟数据
  - `assignmentSubmissions`：每日作业提交百分比（0-100），当前为模拟数据
  - 注意：课程访问和作业提交的统计数据将在后续版本中实现真实数据收集

### 4.11 异步任务与报表

#### POST `/api/v1/jobs/reports`
- 创建报表（成绩单、课程统计）。请求示例：
```json
{
  "jobType": "score_export",
  "params": {
    "courseId": "C001",
    "format": "xlsx",
    "range": {
      "from": "2025-02-01",
      "to": "2025-07-31"
    }
  },
  "notifyChannels": ["inbox","email"]
}
```

#### GET `/api/v1/jobs/{jobId}`
- 查询任务状态：`queued|processing|succeeded|failed`；成功后返回 `resultUrl`。

#### POST `/api/v1/jobs/{jobId}/cancel`
- 取消未完成任务。

### 4.12 系统健康与运维

#### GET `/actuator/health`
- 基础健康检查，返回应用、数据库、对象存储、消息队列状态。

#### GET `/api/v1/health/metrics`
- 扩展指标（请求数、错误率、延迟分位数）。

#### POST `/api/v1/admin/cache/refresh`
- 刷新缓存（课程目录、配置项等）；需要 `admin` 权限并记录审计。

## 5. 数据同步与外部集成

### 5.1 教务系统同步
- 定时任务调用 `/api/v1/integration/registrar/pull`（内部调用）同步学籍、课程基础数据。
- 支持管理员手动触发：`POST /api/v1/admin/integration/sync`。

### 5.2 统一身份认证
- SSO 回调地址：`POST /api/v1/auth/sso/callback`
- 请求体包含 `ticket`、`signature`；后端验证后创建或绑定用户。

### 5.3 通知服务
- 邮件、短信统一经 `/api/v1/integration/notifications/dispatch`；对外封装，内部调用第三方服务。

### 5.4 Python 图像服务（OSS 子系统）
- 组件位置：`oss/`（Flask 应用，默认端口 `5000`，上传目录 `./uploads`）。
- 服务职责：为前端/后台提供轻量级的图片直传与访问能力，采用文件内容 SHA-256 生成文件名，实现秒传与去重。
- **上传接口**
  - `POST $BASE_URL/api/v1/images/upload`
  - 请求：`multipart/form-data`，表单字段 `file`。
  - 响应：
    ```json
    {
      "success": true,
      "url": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.png"
    }
    ```
    - `url` 为文件名（含扩展名）；前端可拼接成 `$BASE_URL/api/v1/images/{url}` 访问。
    - 若文件已存在，会复用原文件名，保证幂等。
  - 失败示例（缺少文件）：
    ```json
    {
      "success": false,
      "error": "No file part"
    }
    ```
    - HTTP 400；如文件名为空返回 `No selected file`。
- **下载接口**
  - `GET $BASE_URL/api/v1/images/{filename}`
  - 成功：直接返回图片二进制内容（Content-Type 按扩展名推断）。
  - 失败：`404`
    ```json
    {
      "success": false,
      "error": "Image not found"
    }
    ```
- 部署/运行备注：
  - 需确保 `security` 层面通过网关或 Nginx 进行访问控制与限流。
  - `uploads/` 目录需挂载持久化存储，建议定期备份或接入云对象存储。
  - 可通过 `oss/test_upload.sh` 验证上传链路。

## 6. 安全与合规要点
- 所有接口强制 HTTPS，支持 TLS1.2+。
- 上传文件自动触发病毒扫描，结果回写 `Submission`。
- 高风险操作（批量删课、成绩修改）需 `X-Confirmation-Code` 双因子校验。
- 审批接口写入不可篡改日志。
- 数据访问遵循最小权限；教师仅可访问自己课程数据。

## 7. 测试与版本管理
- 每个接口提供 Postman 集合与自动化契约测试。
- 破坏性变更通过 `beta` 版本发布，旧版保留 6 个月。
- 版本进度：
  - **v1.0**：登录、课程、作业与提交、成绩、审批最小可用。
  - **v1.1**：AI 助手、异步报表、批量通知。
  - **v1.2**：扩展统计分析、细粒度权限、课程分段发布。

## 8. 附录：常见响应示例

### 8.1 分页响应
```json
{
  "traceId": "8f3d4e21",
  "success": true,
  "data": [
    {
      "courseId": "C001",
      "name": "Python 程序设计",
      "semester": "2025春",
      "status": "published",
      "tags": ["计算机", "基础"],
      "stats": {
        "enrolled": 180,
        "capacity": 200,
        "completionRate": 0.73
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 134,
    "sort": "name,asc"
  },
  "error": null
}
```

### 8.4 统一响应与分页约定（社团管理子域）
- 路径前缀：`/api/v1`（例如 `/api/v1/members`、`/api/v1/activities`、`/api/v1/applications`、`/api/v1/attendance`、`/api/v1/dashboard/overview`）
- 统一响应包裹：同上（`traceId/success/data/meta/error`）
- 分页参数：`page` 与 `pageSize`（`limit` 将在一个版本周期内作为兼容别名保留）
- 错误码前缀：`CLUB.*`（如 `CLUB.MEMBER_EXISTS`, `CLUB.ACTIVITY_TIME_CONFLICT`）

### 8.2 校验失败
```json
{
  "traceId": "a0c1d2e3",
  "success": false,
  "data": null,
  "error": {
    "code": "COMMON.VALIDATION_FAILED",
    "message": "提交内容不符合要求",
    "details": [
      {"field": "attachments[0].size", "message": "文件超过最大限制 100MB"},
      {"field": "deadline", "message": "截止时间需晚于当前时间"}
    ]
  }
}
```

### 8.3 审批通过
```json
{
  "traceId": "b7e6f512",
  "success": true,
  "data": {
    "requestId": "APR-202409-0001",
    "status": "approved",
    "processedBy": "U0001",
    "processedAt": "2025-09-01T10:23:11+08:00",
    "comment": "课程资料齐全，同意上线"
  },
  "meta": null,
  "error": null
}
```

---

本文件为项目初版 API 设计，后续迭代需同步更新，并在发布前进行评审与基准测试。

