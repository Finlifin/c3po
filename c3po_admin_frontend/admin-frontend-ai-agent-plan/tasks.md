# Implementation Plan

## 设计约束

### 响应式设计约束

- **约束范围**：`frontend/design/UI设计/pages/admin/` 中的管理前端页面设计
- **要求**：所有管理前端页面应尽量采用响应式设计，确保在不同设备（桌面、平板、移动设备）上都能良好显示和使用
- **实现要点**：
  - 使用 Tailwind CSS 响应式工具类（如 `sm:`, `md:`, `lg:`, `xl:` 断点）
  - 布局应适配移动端（侧边栏折叠、导航菜单汉堡菜单化等）
  - 表格、表单等组件在小屏幕上应采用堆叠或可滚动布局
  - 图表和可视化组件应自动调整尺寸以适应容器
  - 触摸友好的交互元素（按钮、链接间距适当）

- [ ] 1. 项目基础设施搭建
  - 配置 TypeScript 严格模式和路径别名
  - 安装和配置核心依赖（状态管理、数据获取、表单处理、UI 组件库）
  - 设置 ESLint 和 Prettier 代码规范
  - 配置 Tailwind CSS 主题和自定义样式
  - _Requirements: 所有需求的基础_

- [ ] 2. API 客户端和认证系统
- [ ] 2.1 实现 API 客户端基础架构
  - 创建 Axios 实例配置
  - 实现请求/响应拦截器
  - 实现错误处理和重试逻辑
  - 创建 API 响应类型定义
  - _Requirements: 1.5, 11.1, 11.2_

- [ ] 2.2 实现认证相关 API 调用
  - 实现 login、logout、refreshToken 方法
  - 实现 Token 存储和读取工具函数
  - 创建认证状态管理（Context 或 Zustand）
  - _Requirements: 1.2, 1.4_

- [ ] 2.3 编写 API 客户端属性测试
  - **Property 5: API requests include authorization header**
  - **Validates: Requirements 1.5**

- [ ] 2.4 实现路由保护和认证检查
  - 创建认证中间件或 HOC
  - 实现未认证重定向逻辑
  - 实现 Token 过期处理
  - _Requirements: 1.1, 1.3_

- [ ] 2.5 编写认证流程属性测试
  - **Property 1: Unauthenticated access redirects to login**
  - **Property 2: Successful login stores JWT token**
  - **Property 3: Expired token triggers re-authentication**
  - **Property 4: Logout clears authentication state**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [ ] 3. 核心布局组件
- [ ] 3.1 实现登录页面布局
  - 创建登录表单组件
  - 实现表单验证（React Hook Form + Zod）
  - 集成登录 API 调用
  - 实现错误提示和加载状态
  - _Requirements: 1.2_

- [ ] 3.2 实现主应用布局（侧边栏 + 顶栏）
  - 创建 Sidebar 组件（导航菜单、折叠功能）
  - 创建 TopBar 组件（用户信息、通知、登出）
  - 实现响应式布局（移动端适配）
  - 实现当前路由高亮
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 3.3 实现面包屑导航组件
  - 创建 Breadcrumb 组件
  - 实现根据路由自动生成面包屑
  - _Requirements: 10.4_

- [ ] 3.4 编写布局组件属性测试
  - **Property 33: Active navigation item is highlighted**
  - **Property 34: Breadcrumb reflects current path**
  - **Property 35: Mobile navigation is collapsible**
  - **Validates: Requirements 10.2, 10.3, 10.4**

- [ ] 4. 通用 UI 组件
- [ ] 4.1 实现数据表格组件
  - 创建 DataTable 组件（支持排序、筛选、分页）
  - 实现表格列配置
  - 实现空状态显示
  - 实现操作列按钮
  - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_

- [ ] 4.2 编写表格组件属性测试
  - **Property 14: Sorting updates API parameters**
  - **Property 40: Empty table shows empty state**
  - **Property 41: Table action buttons trigger correct handlers**
  - **Validates: Requirements 12.1, 12.5, 12.6**

- [ ] 4.3 实现统计卡片组件
  - 创建 StatCard 组件
  - 支持图标、标题、数值、趋势显示
  - _Requirements: 2.1_

- [ ] 4.4 实现图表组件
  - 集成图表库（Recharts 或 Chart.js）
  - 创建 LineChart 组件（用于趋势展示）
  - 创建 BarChart 组件（用于分布展示）
  - 实现图表响应式和交互（Tooltip）
  - _Requirements: 6.4, 13.1, 13.2, 13.4, 13.5_

- [ ] 4.5 编写图表组件属性测试
  - **Property 42: Line chart renders time series data**
  - **Property 43: Chart tooltip displays on hover**
  - **Property 44: Charts are responsive**
  - **Validates: Requirements 13.1, 13.4, 13.5**

- [ ] 4.6 实现表单组件
  - 创建 FormField 组件（集成验证和错误显示）
  - 创建 ConfirmDialog 组件
  - 创建 FormModal 组件
  - 实现 Toast/Snackbar 通知组件
  - _Requirements: 11.3, 11.4, 11.6_

- [ ] 4.7 编写表单组件属性测试
  - **Property 36: Form validation errors display inline**
  - **Property 37: Successful operations show toast notification**
  - **Property 39: Dangerous operations require confirmation**
  - **Validates: Requirements 11.3, 11.4, 11.6**

- [ ] 5. 仪表板功能
- [ ] 5.1 实现仪表板 API 调用
  - 实现 getDashboardOverview 方法
  - 实现 getDashboardUsageTrend 方法
  - 实现 getDashboardPendingTasks 方法
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5.2 实现仪表板页面
  - 创建仪表板布局
  - 展示概览统计卡片（总成员数、活跃成员数、活动总数、待审批数）
  - 展示使用趋势图表
  - 展示待处理任务
  - 实现数据加载和错误处理
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5.3 编写仪表板属性测试
  - **Property 6: Dashboard displays all overview metrics**
  - **Property 7: Usage trend chart renders with correct data**
  - **Property 8: Pending tasks display all required fields**
  - **Property 9: API errors show user-friendly messages**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ] 6. 用户管理功能
- [ ] 6.1 实现用户管理 API 调用
  - 实现 getUsers 方法（支持分页、排序、筛选）
  - 实现 createUsers 批量创建方法
  - 实现 updateUser 方法
  - 实现 updateUserStatus 方法
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

- [ ] 6.2 实现用户列表页面
  - 创建用户列表表格
  - 实现筛选器（角色、状态、关键字、院系）
  - 实现分页和排序
  - 实现操作按钮（查看、编辑、状态管理）
  - _Requirements: 3.1, 3.2, 3.7, 3.8_

- [ ] 6.3 编写用户列表属性测试
  - **Property 10: User list displays with correct filters**
  - **Property 13: Pagination parameters are correctly transmitted**
  - **Property 14: Sorting updates API parameters**
  - **Validates: Requirements 3.1, 3.2, 3.7, 3.8**

- [ ] 6.4 实现用户创建表单
  - 创建用户创建模态框
  - 实现表单验证（用户名、邮箱、密码、角色、档案）
  - 支持批量创建
  - 显示创建结果（成功和失败记录）
  - _Requirements: 3.3, 3.4_

- [ ] 6.5 编写用户创建属性测试
  - **Property 11: Batch user creation shows all results**
  - **Validates: Requirements 3.4**

- [ ] 6.6 实现用户编辑和状态管理
  - 创建用户编辑模态框
  - 实现状态修改表单（要求输入原因）
  - _Requirements: 3.5, 3.6_

- [ ] 6.7 编写用户状态管理属性测试
  - **Property 12: User status change requires reason**
  - **Validates: Requirements 3.6**

- [ ] 7. 课程管理功能
- [x] 7.1 实现课程管理 API 调用
  - 实现 getCourses 方法（支持分页、排序、筛选）
  - 实现 getCourse 方法
  - 实现 createCourse 和 updateCourse 方法
  - 实现 getCourseStudents 方法
  - 实现 getCourseModules 方法
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 7.2 实现课程列表页面
  - 创建课程列表表格（显示指标：选课人数、作业数、章节数）
  - 实现筛选器（关键字、教师、状态）
  - 实现分页和排序
  - _Requirements: 4.1, 4.2_

- [ ] 7.3 编写课程列表属性测试
  - **Property 15: Course list displays metrics**
  - **Property 16: Course filters update results**
  - **Validates: Requirements 4.1, 4.2**

- [x] 7.4 实现课程详情页面
  - 展示课程基本信息
  - 展示选课学生列表
  - 展示课程章节和资源（按顺序）
  - _Requirements: 4.3, 4.6, 4.7_

- [ ] 7.5 编写课程详情属性测试
  - **Property 17: Course modules display in order**
  - **Validates: Requirements 4.7**

- [x] 7.6 实现课程创建和编辑表单
  - 创建课程表单模态框
  - 实现表单验证
  - _Requirements: 4.4, 4.5_

- [ ] 8. 作业和提交管理功能
- [ ] 8.1 实现作业管理 API 调用
  - 实现 getAssignments 方法
  - 实现 getAssignment 方法
  - 实现 getSubmissions 方法
  - 实现 getSubmission 方法
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.2 实现作业列表页面
  - 创建作业列表表格（显示提交率、逾期率）
  - 实现作业详情查看
  - _Requirements: 5.1, 5.2_

- [ ] 8.3 编写作业列表属性测试
  - **Property 18: Assignment list shows submission metrics**
  - **Validates: Requirements 5.1**

- [ ] 8.4 实现提交管理页面
  - 展示作业的所有提交列表
  - 实现提交详情查看（附件、评分、反馈、Rubric）
  - 展示测验尝试记录
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 8.5 编写提交详情属性测试
  - **Property 19: Submission details include all fields**
  - **Validates: Requirements 5.4**

- [x] 9. 成绩管理和分析功能
- [x] 9.1 实现成绩管理 API 调用
  - 实现 getStudentScores 方法
  - 实现 getCourseScores 方法
  - 实现 getCourseAnalytics 方法
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 9.2 实现学生成绩页面
  - 展示成绩明细表格
  - 展示综合概览（平均分、GPA、进度）
  - 展示学习趋势图表
  - _Requirements: 6.1_

- [x] 9.3 编写学生成绩属性测试
  - **Property 20: Student scores display all sections**
  - **Validates: Requirements 6.1**

- [x] 9.4 实现课程成绩统计页面
  - 展示总体统计（均分、中位数）
  - 展示分数分布图表
  - 展示高分和风险学生列表
  - _Requirements: 6.2, 6.4_

- [x] 9.5 编写课程成绩统计属性测试
  - **Property 21: Course score distribution renders correctly**
  - **Validates: Requirements 6.2, 6.4**

- [x] 9.6 实现课程分析页面
  - 展示完成率、平均分等指标
  - 展示滞后学生和风险学生
  - 提供导出功能提示
  - _Requirements: 6.3, 6.5_

- [x] 9.7 编写课程分析属性测试
  - **Property 22: Course analytics displays all metrics**
  - **Validates: Requirements 6.3**

- [ ] 10. 审批管理功能
- [ ] 10.1 实现审批管理 API 调用
  - 实现 getApprovals 方法（支持筛选）
  - 实现 processApproval 方法
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 10.2 实现审批列表页面
  - 创建审批列表表格
  - 实现筛选器（状态、类型）
  - 解析并展示 payload 内容
  - 在导航栏显示待审批数量徽章
  - _Requirements: 7.1, 7.2, 7.3, 7.6_

- [ ] 10.3 编写审批列表属性测试
  - **Property 23: Approval list filters work correctly**
  - **Property 24: Approval payload is parsed and displayed**
  - **Property 26: Pending approval count displays in navigation**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.6**

- [ ] 10.4 实现审批决策功能
  - 创建审批决策模态框
  - 实现决策表单（通过/驳回，要求输入意见）
  - _Requirements: 7.4, 7.5_

- [ ] 10.5 编写审批决策属性测试
  - **Property 25: Approval decision requires comment for rejection**
  - **Validates: Requirements 7.4, 7.5**

- [ ] 11. 通知管理功能
- [ ] 11.1 实现通知管理 API 调用
  - 实现 getNotifications 方法（支持筛选）
  - 实现 createNotification 方法
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 11.2 实现通知列表页面
  - 创建通知列表表格
  - 实现筛选器（目标类型、状态）
  - 显示通知状态（草稿、已发送、失败）
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 11.3 编写通知列表属性测试
  - **Property 27: Notification list displays all fields**
  - **Property 29: Notification status is visually distinct**
  - **Validates: Requirements 8.1, 8.5**

- [ ] 11.4 实现通知创建功能
  - 创建通知创建模态框
  - 实现表单验证（标题、内容、发送渠道）
  - _Requirements: 8.3, 8.4_

- [ ] 11.5 编写通知创建属性测试
  - **Property 28: Notification creation validates required fields**
  - **Validates: Requirements 8.3, 8.4**

- [ ] 12. 系统设置功能
- [ ] 12.1 实现系统设置 API 调用
  - 实现 getSystemSettings 方法
  - 实现 updateSystemSettings 方法
  - _Requirements: 9.1, 9.5_

- [ ] 12.2 实现系统设置页面
  - 展示当前配置（维护窗口、密码策略、告警阈值）
  - 实现维护窗口设置表单（验证时间顺序）
  - 实现密码策略设置表单
  - 实现告警阈值设置表单（验证数值范围）
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 12.3 编写系统设置属性测试
  - **Property 30: Maintenance window validates time order**
  - **Property 31: Password policy validates numeric ranges**
  - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 12.4 实现设置更新功能
  - 提交设置更改
  - 显示成功提示并刷新配置
  - _Requirements: 9.5, 9.6_

- [ ] 12.5 编写设置更新属性测试
  - **Property 32: Settings update triggers refresh**
  - **Validates: Requirements 9.5, 9.6**

- [x] 13. 搜索和筛选功能优化
- [x] 13.1 实现通用搜索组件
  - 创建 SearchInput 组件（支持防抖）
  - 实现搜索参数传递
  - _Requirements: 14.1_

- [x] 13.2 实现高级筛选面板
  - 创建可展开/折叠的筛选面板
  - 实现多条件组合筛选
  - 实现清除筛选功能
  - 实现空搜索结果提示
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [x] 13.3 编写搜索筛选属性测试
  - **Property 45: Search keyword is transmitted to API**
  - **Property 46: Multiple filters are combined**
  - **Property 47: Clear filters resets to default**
  - **Property 50: Frequent operations are debounced**
  - **Validates: Requirements 14.1, 14.2, 14.3, 15.5**

- [ ] 14. 性能优化
- [ ] 14.1 实现数据缓存策略
  - 配置 SWR 或 TanStack Query
  - 实现数据缓存和重新验证
  - 实现乐观更新
  - _Requirements: 15.3_

- [ ] 14.2 实现懒加载和代码分割
  - 使用 Next.js dynamic import 实现路由级代码分割
  - 实现图片懒加载
  - 实现组件懒加载
  - _Requirements: 15.4_

- [ ] 14.3 实现虚拟滚动
  - 为大数据量列表实现虚拟滚动
  - _Requirements: 15.2_

- [ ] 14.4 编写性能属性测试
  - **Property 48: First contentful paint under 3 seconds**
  - **Property 49: Large lists use pagination or virtual scrolling**
  - **Validates: Requirements 15.1, 15.2**

- [ ] 15. 加载状态和错误处理完善
- [ ] 15.1 实现全局加载指示器
  - 创建 LoadingSpinner 组件
  - 实现页面级加载状态
  - 实现按钮级加载状态
  - _Requirements: 11.5_

- [ ] 15.2 编写加载状态属性测试
  - **Property 38: Long operations show loading indicator**
  - **Validates: Requirements 11.5**

- [ ] 15.3 实现错误边界
  - 创建 ErrorBoundary 组件
  - 实现错误页面（404、500）
  - _Requirements: 11.1, 11.2_

- [ ] 16. 最终检查点
  - 确保所有测试通过
  - 验证所有页面功能正常
  - 检查响应式布局在不同设备上的表现
  - 运行性能测试并优化
  - 如有问题，请向用户询问
