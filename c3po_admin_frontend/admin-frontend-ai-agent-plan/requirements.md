# Requirements Document

## Introduction

本文档定义智慧学习平台管理前端（C3PO Admin Frontend）的功能需求。该系统是一个基于 Next.js 的现代化 Web 应用，为平台管理员提供全面的管理能力，包括用户管理、课程管理、作业批改、成绩发布、审批流程、数据分析等核心功能。系统需要与后端 API（`/api/v1`）进行交互，提供直观、高效的管理界面。

## Glossary

- **Admin Frontend**：管理前端，指本系统，为管理员提供的 Web 管理界面
- **Backend API**：后端 API 服务，提供 RESTful 接口，路径前缀为 `/api/v1`
- **JWT Token**：JSON Web Token，用于用户身份认证的令牌
- **Dashboard**：仪表板，展示平台核心指标和统计数据的概览页面
- **User**：用户，包括学生（Student）、教师（Teacher）、管理员（Admin）三种角色
- **Course**：课程，教学内容的基本单位
- **Assignment**：作业，包括普通作业、测验、项目等类型
- **Submission**：提交，学生对作业的提交记录
- **Approval Request**：审批请求，需要管理员审批的事项
- **Notification**：通知，系统发送给用户的消息
- **ApiResponse**：统一响应结构，包含 `traceId`、`success`、`data`、`meta`、`error` 字段

## Requirements

### Requirement 1: 用户认证与会话管理

**User Story:** 作为管理员，我希望能够安全地登录系统并保持会话状态，以便访问管理功能。

#### Acceptance Criteria

1. WHEN 管理员访问未认证页面 THEN Admin Frontend SHALL 重定向到登录页面
2. WHEN 管理员输入有效凭证并提交登录表单 THEN Admin Frontend SHALL 调用 `/api/v1/auth/login` 并存储返回的 JWT Token
3. WHEN JWT Token 过期 THEN Admin Frontend SHALL 自动刷新 Token 或提示用户重新登录
4. WHEN 管理员点击登出 THEN Admin Frontend SHALL 清除本地存储的 Token 并重定向到登录页面
5. WHEN 请求 API 时 THEN Admin Frontend SHALL 在请求头中携带 `Authorization: Bearer {token}`

### Requirement 2: 仪表板概览

**User Story:** 作为管理员，我希望在首页看到平台的核心指标和统计数据，以便快速了解平台运行状况。

#### Acceptance Criteria

1. WHEN 管理员访问仪表板页面 THEN Admin Frontend SHALL 调用 `/api/v1/dashboard/overview` 并展示总成员数、活跃成员数、活动总数和待审批申请数
2. WHEN 仪表板加载完成 THEN Admin Frontend SHALL 调用 `/api/v1/dashboard/usage-trend` 并以图表形式展示最近 7 天的使用趋势
3. WHEN 仪表板展示待处理任务 THEN Admin Frontend SHALL 调用 `/api/v1/dashboard/pending-tasks` 并显示待审批申请数和其他关键指标
4. WHEN 数据加载失败 THEN Admin Frontend SHALL 显示友好的错误提示并提供重试选项
5. WHEN 仪表板数据更新 THEN Admin Frontend SHALL 自动刷新显示内容而不需要手动刷新页面

### Requirement 3: 用户管理

**User Story:** 作为管理员，我希望能够查看、创建、编辑和管理平台用户，以便维护用户账户。

#### Acceptance Criteria

1. WHEN 管理员访问用户列表页面 THEN Admin Frontend SHALL 调用 `/api/v1/admin/users` 并以表格形式展示用户列表
2. WHEN 管理员使用筛选条件（角色、状态、关键字、院系）THEN Admin Frontend SHALL 将筛选参数传递给 API 并更新列表显示
3. WHEN 管理员点击创建用户按钮 THEN Admin Frontend SHALL 显示用户创建表单，支持批量创建学生、教师、管理员账号
4. WHEN 管理员提交用户创建表单 THEN Admin Frontend SHALL 调用 `/api/v1/admin/users` POST 接口并显示创建结果（成功和失败记录）
5. WHEN 管理员点击编辑用户 THEN Admin Frontend SHALL 显示用户编辑表单并调用 `/api/v1/admin/users/{userId}` PATCH 接口更新用户信息
6. WHEN 管理员修改用户状态 THEN Admin Frontend SHALL 调用 `/api/v1/admin/users/{userId}/status` PUT 接口并要求输入状态变更原因
7. WHEN 用户列表支持分页 THEN Admin Frontend SHALL 正确处理 `page` 和 `pageSize` 参数并显示分页控件
8. WHEN 用户列表支持排序 THEN Admin Frontend SHALL 允许按创建时间、更新时间、用户名、邮箱、角色、状态排序

### Requirement 4: 课程管理

**User Story:** 作为管理员，我希望能够查看、创建、编辑和管理课程，以便维护平台的教学内容。

#### Acceptance Criteria

1. WHEN 管理员访问课程列表页面 THEN Admin Frontend SHALL 调用 `/api/v1/courses` 并展示课程列表及其指标（选课人数、作业数量、章节数量）
2. WHEN 管理员使用筛选条件（关键字、教师、状态）THEN Admin Frontend SHALL 将筛选参数传递给 API 并更新列表显示
3. WHEN 管理员点击课程详情 THEN Admin Frontend SHALL 调用 `/api/v1/courses/{courseId}` 并展示课程完整信息
4. WHEN 管理员点击创建课程 THEN Admin Frontend SHALL 显示课程创建表单并调用 `/api/v1/courses` POST 接口
5. WHEN 管理员编辑课程信息 THEN Admin Frontend SHALL 调用 `/api/v1/courses/{courseId}` PUT 接口更新课程
6. WHEN 管理员查看课程选课学生 THEN Admin Frontend SHALL 调用 `/api/v1/courses/{courseId}/students` 并展示学生列表
7. WHEN 管理员查看课程章节和资源 THEN Admin Frontend SHALL 调用 `/api/v1/courses/{courseId}/modules` 并按顺序展示章节及资源

### Requirement 5: 作业与提交管理

**User Story:** 作为管理员，我希望能够查看和管理作业及学生提交，以便监督教学进度和质量。

#### Acceptance Criteria

1. WHEN 管理员访问作业列表页面 THEN Admin Frontend SHALL 调用 `/api/v1/courses/{courseId}/assignments` 并展示作业列表及提交率、逾期率
2. WHEN 管理员查看作业详情 THEN Admin Frontend SHALL 调用 `/api/v1/assignments/{assignmentId}` 并展示作业说明、评分尺度等信息
3. WHEN 管理员查看作业的所有提交 THEN Admin Frontend SHALL 调用 `/api/v1/assignments/{assignmentId}/submissions` 并展示提交列表
4. WHEN 管理员查看单个提交详情 THEN Admin Frontend SHALL 调用 `/api/v1/submissions/{submissionId}` 并展示附件、评分、反馈等信息
5. WHEN 管理员查看测验尝试 THEN Admin Frontend SHALL 调用 `/api/v1/assignments/{assignmentId}/quiz-attempts` 并展示所有学生的测验记录

### Requirement 6: 成绩管理与分析

**User Story:** 作为管理员，我希望能够查看和分析学生成绩，以便了解教学效果和学生表现。

#### Acceptance Criteria

1. WHEN 管理员查看学生成绩 THEN Admin Frontend SHALL 调用 `/api/v1/students/{studentId}/scores` 并展示成绩明细、综合概览和学习趋势
2. WHEN 管理员查看课程成绩统计 THEN Admin Frontend SHALL 调用 `/api/v1/courses/{courseId}/scores` 并展示总体均分、分数分布、高分/风险学生
3. WHEN 管理员查看课程分析 THEN Admin Frontend SHALL 调用 `/api/v1/courses/{courseId}/analytics/overview` 并展示完成率、平均分、滞后学生等指标
4. WHEN 成绩数据包含图表 THEN Admin Frontend SHALL 使用图表库（如 Chart.js 或 Recharts）可视化展示分数分布和趋势
5. WHEN 管理员需要导出成绩 THEN Admin Frontend SHALL 提供导出功能提示并引导创建报表任务

### Requirement 7: 审批管理

**User Story:** 作为管理员，我希望能够查看和处理待审批事项，以便及时响应用户请求。

#### Acceptance Criteria

1. WHEN 管理员访问审批列表页面 THEN Admin Frontend SHALL 调用 `/api/v1/admin/approvals` 并展示待审批事项列表
2. WHEN 管理员使用筛选条件（状态、类型）THEN Admin Frontend SHALL 将筛选参数传递给 API 并更新列表显示
3. WHEN 管理员查看审批详情 THEN Admin Frontend SHALL 解析 `payload` 字段并展示申请的具体内容
4. WHEN 管理员处理审批 THEN Admin Frontend SHALL 显示决策表单（通过/驳回）并要求输入处理意见
5. WHEN 管理员提交审批决策 THEN Admin Frontend SHALL 调用 `/api/v1/admin/approvals/{requestId}/decision` POST 接口并更新审批状态
6. WHEN 审批列表显示待处理数量 THEN Admin Frontend SHALL 在导航栏或侧边栏显示待审批数量徽章

### Requirement 8: 通知管理

**User Story:** 作为管理员，我希望能够查看和发送通知，以便与用户沟通重要信息。

#### Acceptance Criteria

1. WHEN 管理员访问通知列表页面 THEN Admin Frontend SHALL 调用 `/api/v1/notifications` 并展示通知历史
2. WHEN 管理员使用筛选条件（目标类型、状态）THEN Admin Frontend SHALL 将筛选参数传递给 API 并更新列表显示
3. WHEN 管理员点击创建通知 THEN Admin Frontend SHALL 显示通知创建表单，包含标题、内容、发送渠道选择
4. WHEN 管理员提交通知表单 THEN Admin Frontend SHALL 调用 `/api/v1/notifications` POST 接口并立即发送通知
5. WHEN 通知列表显示发送状态 THEN Admin Frontend SHALL 清晰标识通知的状态（草稿、已发送、失败）

### Requirement 9: 系统设置管理

**User Story:** 作为管理员，我希望能够配置系统全局设置，以便控制平台行为和策略。

#### Acceptance Criteria

1. WHEN 管理员访问系统设置页面 THEN Admin Frontend SHALL 调用 `/api/v1/admin/system/settings` GET 接口并展示当前配置
2. WHEN 管理员修改维护窗口设置 THEN Admin Frontend SHALL 验证开始时间早于结束时间并提供日期时间选择器
3. WHEN 管理员修改密码策略 THEN Admin Frontend SHALL 提供表单控件设置最小长度、复杂度要求和过期天数
4. WHEN 管理员修改告警阈值 THEN Admin Frontend SHALL 验证数值范围并提供合理的默认值
5. WHEN 管理员提交设置更改 THEN Admin Frontend SHALL 调用 `/api/v1/admin/system/settings` PUT 接口并显示更新结果
6. WHEN 设置更改成功 THEN Admin Frontend SHALL 显示成功提示并刷新显示的配置

### Requirement 10: 响应式布局与导航

**User Story:** 作为管理员，我希望系统具有清晰的导航结构和响应式布局，以便在不同设备上高效使用。

#### Acceptance Criteria

1. WHEN 管理员访问任何页面 THEN Admin Frontend SHALL 显示侧边栏导航，包含所有主要功能模块的链接
2. WHEN 管理员在移动设备上访问 THEN Admin Frontend SHALL 提供可折叠的侧边栏或汉堡菜单
3. WHEN 管理员切换页面 THEN Admin Frontend SHALL 高亮当前活动的导航项
4. WHEN 页面包含面包屑导航 THEN Admin Frontend SHALL 显示当前位置的层级路径
5. WHEN 管理员访问顶部导航栏 THEN Admin Frontend SHALL 显示用户信息、通知图标和登出按钮

### Requirement 11: 错误处理与用户反馈

**User Story:** 作为管理员，我希望系统能够优雅地处理错误并提供清晰的反馈，以便了解操作结果。

#### Acceptance Criteria

1. WHEN API 请求失败（网络错误、超时）THEN Admin Frontend SHALL 显示友好的错误提示并提供重试选项
2. WHEN API 返回错误响应（4xx、5xx）THEN Admin Frontend SHALL 解析 `error` 字段并显示具体错误信息
3. WHEN 表单验证失败 THEN Admin Frontend SHALL 在对应字段旁显示验证错误信息
4. WHEN 操作成功完成 THEN Admin Frontend SHALL 显示成功提示（Toast 或 Snackbar）
5. WHEN 长时间操作进行中 THEN Admin Frontend SHALL 显示加载指示器（Spinner 或进度条）
6. WHEN 用户执行危险操作（删除、禁用）THEN Admin Frontend SHALL 显示确认对话框要求二次确认

### Requirement 12: 数据表格与分页

**User Story:** 作为管理员，我希望数据表格具有排序、筛选、分页功能，以便高效浏览和查找数据。

#### Acceptance Criteria

1. WHEN 数据表格展示列表数据 THEN Admin Frontend SHALL 支持列排序（点击列头切换升序/降序）
2. WHEN 数据表格支持筛选 THEN Admin Frontend SHALL 提供筛选输入框或下拉菜单，实时更新表格内容
3. WHEN 数据表格支持分页 THEN Admin Frontend SHALL 显示分页控件，包含页码、每页条数选择和总数显示
4. WHEN 管理员切换页码或每页条数 THEN Admin Frontend SHALL 调用 API 并传递正确的 `page` 和 `pageSize` 参数
5. WHEN 数据表格包含操作列 THEN Admin Frontend SHALL 提供操作按钮（查看、编辑、删除等）并正确处理点击事件
6. WHEN 表格数据为空 THEN Admin Frontend SHALL 显示友好的空状态提示

### Requirement 13: 图表与数据可视化

**User Story:** 作为管理员，我希望通过图表直观地查看统计数据和趋势，以便快速理解数据含义。

#### Acceptance Criteria

1. WHEN 仪表板展示使用趋势 THEN Admin Frontend SHALL 使用折线图展示活跃用户、课程访问、作业提交的时间序列数据
2. WHEN 成绩分析展示分数分布 THEN Admin Frontend SHALL 使用柱状图或直方图展示分数区间的学生数量
3. WHEN 图表数据更新 THEN Admin Frontend SHALL 平滑过渡到新数据而不是突然跳变
4. WHEN 图表支持交互 THEN Admin Frontend SHALL 提供悬停提示（Tooltip）显示详细数值
5. WHEN 图表在移动设备上显示 THEN Admin Frontend SHALL 自动调整尺寸和布局以适应小屏幕

### Requirement 14: 搜索与筛选

**User Story:** 作为管理员，我希望能够快速搜索和筛选数据，以便找到特定的用户、课程或记录。

#### Acceptance Criteria

1. WHEN 管理员在搜索框输入关键字 THEN Admin Frontend SHALL 实时或在提交后调用 API 并传递 `keyword` 参数
2. WHEN 管理员使用多个筛选条件 THEN Admin Frontend SHALL 组合所有筛选参数并调用 API
3. WHEN 管理员清除筛选条件 THEN Admin Frontend SHALL 重置所有筛选器并重新加载默认数据
4. WHEN 搜索结果为空 THEN Admin Frontend SHALL 显示"未找到匹配结果"的提示
5. WHEN 搜索支持高级筛选 THEN Admin Frontend SHALL 提供展开/折叠的高级筛选面板

### Requirement 15: 性能优化与用户体验

**User Story:** 作为管理员，我希望系统响应迅速且流畅，以便提高工作效率。

#### Acceptance Criteria

1. WHEN 页面首次加载 THEN Admin Frontend SHALL 在 3 秒内完成首屏渲染
2. WHEN 数据列表包含大量记录 THEN Admin Frontend SHALL 使用虚拟滚动或分页避免性能问题
3. WHEN 用户频繁切换页面 THEN Admin Frontend SHALL 缓存已加载的数据以减少重复请求
4. WHEN 图片或资源加载 THEN Admin Frontend SHALL 使用懒加载和占位符提升感知性能
5. WHEN 用户操作触发 API 请求 THEN Admin Frontend SHALL 防抖或节流避免重复请求
