# Design Document

## Overview

C3PO Admin Frontend 是一个基于 Next.js 15+ 和 React 19 的现代化管理后台系统，为智慧学习平台的管理员提供全面的管理能力。系统采用 App Router 架构，使用 TypeScript 确保类型安全，Tailwind CSS 提供样式支持。

### 核心目标

1. **功能完整性**：覆盖用户管理、课程管理、作业批改、成绩分析、审批流程等所有管理功能
2. **用户体验**：提供直观、响应迅速的界面，支持桌面和移动设备
3. **可维护性**：采用模块化架构，清晰的代码组织和文档
4. **性能优化**：实现数据缓存、懒加载、虚拟滚动等优化策略
5. **安全性**：实现完善的认证授权机制，保护敏感数据

### 技术栈

- **框架**：Next.js 16.0.10 (App Router)
- **UI 库**：React 19.2.1
- **样式**：Tailwind CSS 4
- **状态管理**：React Context + Hooks / Zustand
- **数据获取**：SWR / TanStack Query
- **表单处理**：React Hook Form + Zod
- **图表库**：Recharts / Chart.js
- **UI 组件**：shadcn/ui / Ant Design / Material-UI
- **HTTP 客户端**：Axios / Fetch API
- **类型检查**：TypeScript 5

### 设计约束

#### 响应式设计约束

**约束范围**：`frontend/design/UI设计/pages/admin/` 中的管理前端页面设计

**要求**：所有管理前端页面应尽量采用响应式设计，确保在不同设备（桌面、平板、移动设备）上都能良好显示和使用。

**实现要点**：

1. **布局适配**
   - 使用 Tailwind CSS 响应式工具类（如 `sm:`, `md:`, `lg:`, `xl:` 断点）
   - 侧边栏在移动端应可折叠或替换为汉堡菜单
   - 主内容区域在小屏幕上应全宽显示，不固定左边距

2. **组件响应式**
   - 数据表格在小屏幕上采用横向滚动或卡片式布局
   - 表单字段在小屏幕上采用单列堆叠布局
   - 统计卡片采用响应式网格，移动端单列显示

3. **图表和可视化**
   - 图表组件应自动调整尺寸以适应容器
   - 使用响应式图表库配置，确保在移动端可读性

4. **交互优化**
   - 触摸友好的交互元素（按钮、链接间距适当，至少 44x44px）
   - 移动端优化手势操作（滑动、长按等）

5. **断点策略**
   - 移动端：< 640px (sm)
   - 平板：640px - 1024px (md, lg)
   - 桌面：> 1024px (xl, 2xl)

## Architecture

### 目录结构

```
c3po_admin_frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面组
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/              # 主应用页面组
│   │   ├── dashboard/            # 仪表板
│   │   ├── users/                # 用户管理
│   │   ├── courses/              # 课程管理
│   │   ├── assignments/          # 作业管理
│   │   ├── scores/               # 成绩管理
│   │   ├── approvals/            # 审批管理
│   │   ├── notifications/        # 通知管理
│   │   ├── settings/             # 系统设置
│   │   └── layout.tsx            # 主布局（侧边栏+顶栏）
│   ├── api/                      # API 路由（如需要）
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页（重定向到 dashboard）
├── components/                   # 可复用组件
│   ├── ui/                       # 基础 UI 组件
│   ├── layout/                   # 布局组件
│   ├── forms/                    # 表单组件
│   ├── tables/                   # 表格组件
│   └── charts/                   # 图表组件
├── lib/                          # 工具库
│   ├── api/                      # API 客户端
│   ├── auth/                     # 认证工具
│   ├── hooks/                    # 自定义 Hooks
│   └── utils/                    # 工具函数
├── types/                        # TypeScript 类型定义
└── public/                       # 静态资源
```


### 架构层次

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Pages, Components, UI Elements)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Hooks, State Management, Business)    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (API Client, Data Fetching, Cache)     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Backend API                     │
│  (RESTful API /api/v1/*)                │
└─────────────────────────────────────────┘
```

### 路由设计

采用 Next.js App Router 的路由组（Route Groups）实现布局隔离：

- `(auth)` 组：登录页面，无侧边栏布局
- `(dashboard)` 组：主应用页面，包含侧边栏和顶栏布局

### 认证流程

1. 用户访问受保护页面 → 检查 Token → 无 Token 重定向到登录
2. 用户登录 → 调用 `/api/v1/auth/login` → 存储 JWT Token
3. 后续请求 → 自动在请求头添加 `Authorization: Bearer {token}`
4. Token 过期 → 尝试刷新 Token → 失败则重定向到登录

## Components and Interfaces

### 核心组件

#### 1. Layout Components

**Sidebar**
- 功能：显示导航菜单，支持折叠/展开
- Props：`items: NavItem[]`, `collapsed: boolean`, `onToggle: () => void`
- 状态：当前活动路由高亮

**TopBar**
- 功能：显示用户信息、通知、登出按钮
- Props：`user: User`, `notifications: number`
- 交互：点击通知图标显示通知列表，点击用户头像显示下拉菜单

**Breadcrumb**
- 功能：显示当前页面路径
- Props：`items: BreadcrumbItem[]`
- 自动根据路由生成面包屑

#### 2. Data Display Components

**DataTable**
- 功能：通用数据表格，支持排序、筛选、分页
- Props：`columns: Column[]`, `data: any[]`, `pagination: PaginationConfig`, `onSort`, `onFilter`, `onPageChange`
- 特性：虚拟滚动支持大数据量

**StatCard**
- 功能：显示统计卡片
- Props：`title: string`, `value: number | string`, `icon: ReactNode`, `trend?: Trend`
- 用于仪表板展示关键指标

**Chart**
- 功能：图表组件封装
- 类型：LineChart, BarChart, PieChart
- Props：`data: ChartData`, `config: ChartConfig`

#### 3. Form Components

**FormField**
- 功能：表单字段封装，集成验证和错误显示
- Props：`name: string`, `label: string`, `type: string`, `validation: ValidationRule`

**UserForm**
- 功能：用户创建/编辑表单
- 字段：username, email, password, role, profile
- 验证：使用 Zod schema

**CourseForm**
- 功能：课程创建/编辑表单
- 字段：name, semester, credit, enrollLimit, teacherId

#### 4. Modal Components

**ConfirmDialog**
- 功能：确认对话框
- Props：`title: string`, `message: string`, `onConfirm`, `onCancel`
- 用于危险操作确认

**FormModal**
- 功能：表单模态框
- Props：`title: string`, `children: ReactNode`, `onSubmit`, `onClose`

### API Client 接口

```typescript
interface ApiClient {
  // 认证
  login(credentials: LoginCredentials): Promise<AuthResponse>
  logout(): Promise<void>
  refreshToken(token: string): Promise<AuthResponse>
  
  // 用户管理
  getUsers(params: UserQueryParams): Promise<PaginatedResponse<User>>
  createUsers(users: CreateUserDto[]): Promise<BatchCreateResponse>
  updateUser(id: string, data: UpdateUserDto): Promise<User>
  updateUserStatus(id: string, status: UserStatus, reason: string): Promise<User>
  
  // 课程管理
  getCourses(params: CourseQueryParams): Promise<PaginatedResponse<Course>>
  getCourse(id: string): Promise<Course>
  createCourse(data: CreateCourseDto): Promise<Course>
  updateCourse(id: string, data: UpdateCourseDto): Promise<Course>
  getCourseStudents(id: string): Promise<CourseStudent[]>
  getCourseModules(id: string): Promise<CourseModule[]>
  
  // 作业管理
  getAssignments(courseId: string): Promise<Assignment[]>
  getAssignment(id: string): Promise<Assignment>
  getSubmissions(assignmentId: string): Promise<Submission[]>
  getSubmission(id: string): Promise<Submission>
  
  // 成绩管理
  getStudentScores(studentId: string): Promise<ScoreResponse>
  getCourseScores(courseId: string, params?: ScoreQueryParams): Promise<CourseScoreResponse>
  getCourseAnalytics(courseId: string): Promise<CourseAnalyticsResponse>
  
  // 审批管理
  getApprovals(params: ApprovalQueryParams): Promise<PaginatedResponse<ApprovalRequest>>
  processApproval(id: string, decision: ApprovalDecision): Promise<ApprovalRequest>
  
  // 通知管理
  getNotifications(params: NotificationQueryParams): Promise<PaginatedResponse<Notification>>
  createNotification(data: CreateNotificationDto): Promise<Notification>
  
  // 系统设置
  getSystemSettings(): Promise<SystemSettings>
  updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings>
  
  // 仪表板
  getDashboardOverview(): Promise<DashboardOverview>
  getDashboardUsageTrend(days?: number): Promise<UsageTrend>
  getDashboardPendingTasks(): Promise<PendingTasks>
}
```

## Data Models

### 核心数据类型

```typescript
// 用户相关
interface User {
  id: string
  username: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  status: 'ACTIVE' | 'LOCKED' | 'DISABLED'
  statusReason?: string
  createdAt: string
  updatedAt: string
  studentProfile?: StudentProfile
  teacherProfile?: TeacherProfile
}

interface StudentProfile {
  studentNo: string
  grade: string
  major: string
  className: string
}

interface TeacherProfile {
  teacherNo: string
  department: string
  title: string
  subjects: string[]
}

// 课程相关
interface Course {
  id: string
  name: string
  semester: string
  credit: number
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  enrollLimit: number
  teacherId: string
  metrics?: {
    enrolled: number
    assignments: number
    modules: number
  }
}

interface CourseModule {
  id: string
  courseId: string
  title: string
  displayOrder: number
  releaseAt?: string
  resources: CourseResource[]
}

interface CourseResource {
  id: string
  type: 'VIDEO' | 'PDF' | 'LINK' | 'OTHER'
  name: string
  fileSize?: number
  downloadUrl?: string
}

// 作业相关
interface Assignment {
  id: string
  courseId: string
  title: string
  type: 'ASSIGNMENT' | 'QUIZ' | 'PROJECT'
  deadline: string
  allowResubmit: boolean
  maxResubmit?: number
  gradingRubric?: GradingRubric[]
}

interface Submission {
  id: string
  assignmentId: string
  studentId: string
  status: 'SUBMITTED' | 'RESUBMITTED' | 'GRADED' | 'APPEALED'
  score?: number
  feedback?: string
  attachments: string[]
  rubricScores?: RubricScore[]
  resubmitCount: number
  submittedAt: string
}

// 成绩相关
interface Score {
  id: string
  studentId: string
  courseId: string
  component: string
  value: number
  releasedAt: string
}

// 审批相关
interface ApprovalRequest {
  id: string
  type: 'COURSE_PUBLISH' | 'COURSE_DROP_AFTER_DEADLINE' | 'SCORE_APPEAL'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  applicantId: string
  payload: string
  processedBy?: string
  comment?: string
  processedAt?: string
  createdAt: string
}

// 通知相关
interface Notification {
  id: string
  targetType: string
  title: string
  content: string
  sendChannels: ('INBOX' | 'EMAIL' | 'SMS')[]
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED'
  sentAt?: string
  createdAt: string
}

// 系统设置
interface SystemSettings {
  maintenanceWindow: {
    enabled: boolean
    startAt?: string
    endAt?: string
    message?: string
  }
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumber: boolean
    requireSpecial: boolean
    expiryDays?: number
  }
  alertThresholds: {
    loginFailure: number
    storageUsagePercent: number
    jobQueueDelayMinutes: number
  }
}

// API 响应
interface ApiResponse<T> {
  traceId: string
  success: boolean
  data: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    sort?: string
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Properties

**Property 1: Unauthenticated access redirects to login**
*For any* unauthenticated user attempting to access a protected route, the system should redirect to the login page
**Validates: Requirements 1.1**

**Property 2: Successful login stores JWT token**
*For any* valid credentials submitted to the login form, the system should call `/api/v1/auth/login` and store the returned JWT token in local storage
**Validates: Requirements 1.2**

**Property 3: Expired token triggers re-authentication**
*For any* API request with an expired JWT token, the system should attempt to refresh the token or redirect to login
**Validates: Requirements 1.3**

**Property 4: Logout clears authentication state**
*For any* logout action, the system should clear the stored JWT token and redirect to the login page
**Validates: Requirements 1.4**

**Property 5: API requests include authorization header**
*For any* authenticated API request, the request headers should include `Authorization: Bearer {token}`
**Validates: Requirements 1.5**

### Dashboard Properties

**Property 6: Dashboard displays all overview metrics**
*For any* dashboard overview API response, the UI should display totalMembers, activeMembers, totalActivities, and pendingApplications
**Validates: Requirements 2.1**

**Property 7: Usage trend chart renders with correct data**
*For any* usage trend API response, the chart should render with dates, activeUsers, courseVisits, and assignmentSubmissions data series
**Validates: Requirements 2.2**

**Property 8: Pending tasks display all required fields**
*For any* pending tasks API response, the UI should display pendingApplications, activityCount, activeMembers, and totalMembers
**Validates: Requirements 2.3**

**Property 9: API errors show user-friendly messages**
*For any* API request failure (network error, timeout, or error response), the system should display a user-friendly error message and provide a retry option
**Validates: Requirements 2.4, 11.1, 11.2**

### User Management Properties

**Property 10: User list displays with correct filters**
*For any* user query parameters (role, status, keyword, department), the API call should include these parameters and the table should display the filtered results
**Validates: Requirements 3.1, 3.2**

**Property 11: Batch user creation shows all results**
*For any* batch user creation request, the response should display both successfully created users and failed entries with error messages
**Validates: Requirements 3.4**

**Property 12: User status change requires reason**
*For any* user status change to non-ACTIVE status, the form should require a statusReason input before allowing submission
**Validates: Requirements 3.6**

**Property 13: Pagination parameters are correctly transmitted**
*For any* paginated list (users, courses, etc.), changing page or pageSize should trigger an API call with the correct `page` and `pageSize` parameters
**Validates: Requirements 3.7, 12.4**

**Property 14: Sorting updates API parameters**
*For any* sortable column click, the API call should include the correct `sort` parameter in the format `field,(asc|desc)`
**Validates: Requirements 3.8, 12.1**

### Course Management Properties

**Property 15: Course list displays metrics**
*For any* course in the course list, the display should include metrics for enrolled students, assignment count, and module count
**Validates: Requirements 4.1**

**Property 16: Course filters update results**
*For any* combination of course filters (keyword, teacherId, status), the API call should include all filter parameters and update the displayed results
**Validates: Requirements 4.2**

**Property 17: Course modules display in order**
*For any* course modules API response, the modules should be displayed in ascending order by displayOrder
**Validates: Requirements 4.7**

### Assignment and Submission Properties

**Property 18: Assignment list shows submission metrics**
*For any* assignment in the list, the display should include submission rate and overdue rate
**Validates: Requirements 5.1**

**Property 19: Submission details include all fields**
*For any* submission detail view, the display should include attachments, score, feedback, rubricScores, and resubmitCount
**Validates: Requirements 5.4**

### Score Management Properties

**Property 20: Student scores display all sections**
*For any* student scores API response, the UI should display score items, summary (with overall average, GPA, progress), and trend data
**Validates: Requirements 6.1**

**Property 21: Course score distribution renders correctly**
*For any* course scores API response with distribution data, the chart should render bars for each score range (0-59, 60-69, 70-79, 80-89, 90-100)
**Validates: Requirements 6.2, 6.4**

**Property 22: Course analytics displays all metrics**
*For any* course analytics API response, the UI should display completionRate, averageScore, enrolledStudents, totalAssignments, overdueStudents, and atRiskStudents
**Validates: Requirements 6.3**

### Approval Management Properties

**Property 23: Approval list filters work correctly**
*For any* approval query parameters (status, type), the API call should include these parameters and display the filtered approvals
**Validates: Requirements 7.1, 7.2**

**Property 24: Approval payload is parsed and displayed**
*For any* approval request with a JSON payload, the system should parse the payload and display its contents in a readable format
**Validates: Requirements 7.3**

**Property 25: Approval decision requires comment for rejection**
*For any* approval decision with status REJECTED, the form should require a comment input before allowing submission
**Validates: Requirements 7.4, 7.5**

**Property 26: Pending approval count displays in navigation**
*For any* pending approval count greater than zero, a badge should be displayed in the navigation bar showing the count
**Validates: Requirements 7.6**

### Notification Management Properties

**Property 27: Notification list displays all fields**
*For any* notification in the list, the display should include targetType, title, sendChannels, status, and sentAt (if sent)
**Validates: Requirements 8.1**

**Property 28: Notification creation validates required fields**
*For any* notification creation form submission, the system should validate that title, content, and at least one sendChannel are provided
**Validates: Requirements 8.3, 8.4**

**Property 29: Notification status is visually distinct**
*For any* notification with status DRAFT, SENT, or FAILED, the UI should display a visually distinct indicator for each status
**Validates: Requirements 8.5**

### System Settings Properties

**Property 30: Maintenance window validates time order**
*For any* maintenance window configuration, if both startAt and endAt are provided, startAt must be earlier than endAt
**Validates: Requirements 9.2**

**Property 31: Password policy validates numeric ranges**
*For any* password policy update, minLength should be between 6 and 32, and expiryDays (if provided) should be between 1 and 365
**Validates: Requirements 9.3, 9.4**

**Property 32: Settings update triggers refresh**
*For any* successful system settings update, the UI should display a success message and refresh the displayed configuration
**Validates: Requirements 9.5, 9.6**

### Navigation and Layout Properties

**Property 33: Active navigation item is highlighted**
*For any* page navigation, the corresponding navigation item in the sidebar should be visually highlighted
**Validates: Requirements 10.3**

**Property 34: Breadcrumb reflects current path**
*For any* page with breadcrumb navigation, the breadcrumb should display the hierarchical path from root to current page
**Validates: Requirements 10.4**

**Property 35: Mobile navigation is collapsible**
*For any* viewport width less than 768px, the sidebar navigation should be collapsible or replaced with a hamburger menu
**Validates: Requirements 10.2**

### Form Validation Properties

**Property 36: Form validation errors display inline**
*For any* form field that fails validation, an error message should be displayed adjacent to the field
**Validates: Requirements 11.3**

**Property 37: Successful operations show toast notification**
*For any* successful create, update, or delete operation, a toast or snackbar notification should be displayed
**Validates: Requirements 11.4**

**Property 38: Long operations show loading indicator**
*For any* API request that takes longer than 300ms, a loading spinner or progress indicator should be displayed
**Validates: Requirements 11.5**

**Property 39: Dangerous operations require confirmation**
*For any* delete or disable action, a confirmation dialog should be displayed before proceeding
**Validates: Requirements 11.6**

### Table and Data Display Properties

**Property 40: Empty table shows empty state**
*For any* data table with zero rows, an empty state message should be displayed instead of an empty table
**Validates: Requirements 12.6**

**Property 41: Table action buttons trigger correct handlers**
*For any* action button (view, edit, delete) in a table row, clicking the button should trigger the corresponding handler with the correct row data
**Validates: Requirements 12.5**

### Chart Properties

**Property 42: Line chart renders time series data**
*For any* time series data with dates and values, the line chart should render with x-axis showing dates and y-axis showing values
**Validates: Requirements 13.1**

**Property 43: Chart tooltip displays on hover**
*For any* chart data point, hovering over it should display a tooltip with the exact value
**Validates: Requirements 13.4**

**Property 44: Charts are responsive**
*For any* viewport width change, charts should automatically adjust their dimensions to fit the container
**Validates: Requirements 13.5**

### Search and Filter Properties

**Property 45: Search keyword is transmitted to API**
*For any* search input submission, the API call should include the keyword parameter
**Validates: Requirements 14.1**

**Property 46: Multiple filters are combined**
*For any* combination of active filters, all filter parameters should be included in the API call
**Validates: Requirements 14.2**

**Property 47: Clear filters resets to default**
*For any* clear filters action, all filter inputs should be reset and the API should be called without filter parameters
**Validates: Requirements 14.3**

### Performance Properties

**Property 48: First contentful paint under 3 seconds**
*For any* initial page load, the first contentful paint should occur within 3 seconds
**Validates: Requirements 15.1**

**Property 49: Large lists use pagination or virtual scrolling**
*For any* data list with more than 100 items, the system should use either pagination or virtual scrolling
**Validates: Requirements 15.2**

**Property 50: Frequent operations are debounced**
*For any* user input that triggers API calls (search, filter), the calls should be debounced with at least 300ms delay
**Validates: Requirements 15.5**


## Error Handling

### Error Categories

1. **Network Errors**: Connection failures, timeouts
2. **Authentication Errors**: Invalid token, expired session
3. **Validation Errors**: Form validation failures, invalid input
4. **Authorization Errors**: Insufficient permissions
5. **Server Errors**: 5xx responses from backend
6. **Client Errors**: 4xx responses (not found, conflict, etc.)

### Error Handling Strategy

#### API Error Interceptor

```typescript
// Axios interceptor for global error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          handleUnauthorized()
          break
        case 403:
          // Forbidden - show permission error
          showError('您没有权限执行此操作')
          break
        case 404:
          // Not found
          showError('请求的资源不存在')
          break
        case 409:
          // Conflict
          showError(data.error?.message || '操作冲突')
          break
        case 422:
          // Validation error
          handleValidationError(data.error?.details)
          break
        case 500:
        case 502:
        case 503:
          // Server error
          showError('服务器错误，请稍后重试')
          break
        default:
          showError(data.error?.message || '操作失败')
      }
    } else if (error.request) {
      // Request made but no response
      showError('网络连接失败，请检查网络设置')
    } else {
      // Something else happened
      showError('请求失败，请重试')
    }
    
    return Promise.reject(error)
  }
)
```

#### Form Validation

使用 React Hook Form + Zod 进行表单验证：

```typescript
const userSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(64, '用户名最多64个字符'),
  email: z.string()
    .email('请输入有效的邮箱地址'),
  password: z.string()
    .min(8, '密码至少8个字符'),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
})

// In component
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(userSchema)
})
```

#### Error Display Components

- **Toast/Snackbar**: 用于显示临时错误和成功消息
- **Inline Error**: 表单字段旁显示验证错误
- **Error Boundary**: 捕获组件渲染错误
- **Error Page**: 404、500 等错误页面

### Retry Strategy

对于网络错误和临时服务器错误，提供重试机制：

```typescript
const fetchWithRetry = async (fn: () => Promise<any>, retries = 3) => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(1000)
      return fetchWithRetry(fn, retries - 1)
    }
    throw error
  }
}
```

## Testing Strategy

### Unit Testing

使用 Jest + React Testing Library 进行单元测试：

**测试范围**：
- 工具函数（utils）
- 自定义 Hooks
- 独立组件（按钮、输入框、卡片等）
- API 客户端函数

**示例**：
```typescript
// utils/formatDate.test.ts
describe('formatDate', () => {
  it('should format ISO date to readable format', () => {
    expect(formatDate('2025-11-13T08:00:00Z')).toBe('2025-11-13 08:00')
  })
  
  it('should handle invalid date', () => {
    expect(formatDate('invalid')).toBe('Invalid Date')
  })
})

// components/StatCard.test.tsx
describe('StatCard', () => {
  it('should display title and value', () => {
    render(<StatCard title="Total Users" value={125} />)
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('125')).toBeInTheDocument()
  })
})
```

### Integration Testing

测试组件之间的交互和数据流：

**测试范围**：
- 表单提交流程
- 数据加载和显示
- 路由导航
- 状态管理

**示例**：
```typescript
describe('User Management', () => {
  it('should create user and display in list', async () => {
    render(<UserManagementPage />)
    
    // Click create button
    fireEvent.click(screen.getByText('创建用户'))
    
    // Fill form
    fireEvent.change(screen.getByLabelText('用户名'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText('邮箱'), {
      target: { value: 'test@example.com' }
    })
    
    // Submit
    fireEvent.click(screen.getByText('提交'))
    
    // Verify user appears in list
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })
  })
})
```

### Property-Based Testing

使用 fast-check 进行属性测试：

**测试库**：fast-check (JavaScript/TypeScript property-based testing library)

**配置**：每个属性测试至少运行 100 次迭代

**测试范围**：
- API 参数验证
- 数据转换函数
- 排序和筛选逻辑
- 表单验证规则

**标记格式**：每个属性测试必须包含注释标记，格式为：
`// Feature: admin-frontend, Property {number}: {property_text}`

**示例**：
```typescript
// Feature: admin-frontend, Property 13: Pagination parameters are correctly transmitted
describe('Pagination', () => {
  it('should transmit correct page and pageSize parameters', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // page
        fc.integer({ min: 10, max: 100 }), // pageSize
        (page, pageSize) => {
          const params = buildQueryParams({ page, pageSize })
          expect(params.page).toBe(page)
          expect(params.pageSize).toBe(pageSize)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: admin-frontend, Property 30: Maintenance window validates time order
describe('Maintenance Window Validation', () => {
  it('should validate startAt is before endAt', () => {
    fc.assert(
      fc.property(
        fc.date(), // startAt
        fc.date(), // endAt
        (startAt, endAt) => {
          const isValid = validateMaintenanceWindow({ startAt, endAt })
          if (startAt < endAt) {
            expect(isValid).toBe(true)
          } else {
            expect(isValid).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: admin-frontend, Property 46: Multiple filters are combined
describe('Filter Combination', () => {
  it('should combine all active filters in API call', () => {
    fc.assert(
      fc.property(
        fc.record({
          role: fc.option(fc.constantFrom('STUDENT', 'TEACHER', 'ADMIN')),
          status: fc.option(fc.constantFrom('ACTIVE', 'LOCKED', 'DISABLED')),
          keyword: fc.option(fc.string()),
        }),
        (filters) => {
          const params = buildUserQueryParams(filters)
          
          // All provided filters should be in params
          if (filters.role) expect(params.role).toBe(filters.role)
          if (filters.status) expect(params.status).toBe(filters.status)
          if (filters.keyword) expect(params.keyword).toBe(filters.keyword)
          
          // No undefined filters should be in params
          if (!filters.role) expect(params.role).toBeUndefined()
          if (!filters.status) expect(params.status).toBeUndefined()
          if (!filters.keyword) expect(params.keyword).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### E2E Testing

使用 Playwright 进行端到端测试：

**测试范围**：
- 完整的用户流程（登录 → 操作 → 登出）
- 跨页面交互
- 真实 API 集成

**示例**：
```typescript
test('admin can manage users', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="identifier"]', 'admin')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Navigate to users
  await page.click('text=用户管理')
  await expect(page).toHaveURL('/users')
  
  // Create user
  await page.click('text=创建用户')
  await page.fill('[name="username"]', 'newuser')
  await page.fill('[name="email"]', 'new@example.com')
  await page.fill('[name="password"]', 'Password123!')
  await page.click('button:has-text("提交")')
  
  // Verify success
  await expect(page.locator('text=创建成功')).toBeVisible()
  await expect(page.locator('text=newuser')).toBeVisible()
})
```

### Visual Regression Testing

使用 Chromatic 或 Percy 进行视觉回归测试：

**测试范围**：
- 关键页面的视觉一致性
- 响应式布局
- 主题切换

### Performance Testing

**指标**：
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1

**工具**：
- Lighthouse
- WebPageTest
- Chrome DevTools Performance

### Test Coverage Goals

- Unit Tests: > 80% code coverage
- Integration Tests: 覆盖所有关键用户流程
- Property-Based Tests: 覆盖所有 50 个正确性属性
- E2E Tests: 覆盖核心业务场景

