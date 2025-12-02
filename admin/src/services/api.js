import http from './http';

// 认证相关API
export const authAPI = {
  // 登录
  login: (credentials) => http.post('/auth/login', credentials),
  // 注册
  register: (userData) => http.post('/auth/register', userData),
  // 获取当前用户信息
  getProfile: () => http.get('/auth/me'),
  // 登出
  logout: () => http.post('/auth/logout'),
  // 刷新token
  refreshToken: () => http.post('/auth/refresh'),
  // 修改密码
  changePassword: (passwordData) => http.patch('/users/me/password', passwordData)
};

// 用户偏好设置API
export const userPreferencesAPI = {
  // 获取用户偏好设置
  getPreferences: () => http.get('/users/me/preferences'),
  // 更新用户偏好设置
  updatePreferences: (preferencesData) => http.patch('/users/me/preferences', preferencesData)
};

// 用户管理API
export const userAPI = {
  // 获取用户列表
  getUsers: (params) => http.get('/admin/users', { params }),
  // 获取单个用户信息
  getUser: (id) => http.get(`/admin/users/${id}`),
  // 创建用户
  createUser: (userData) => http.post('/admin/users', userData),
  // 更新用户信息
  updateUser: (id, userData) => http.patch(`/admin/users/${id}`, userData),
  // 删除用户
  deleteUser: (id) => http.delete(`/admin/users/${id}`),
  // 更新用户状态
  updateUserStatus: (id, payload) => http.put(`/admin/users/${id}/status`, payload)
};

// 课程管理API
export const courseAPI = {
  // 获取课程列表
  getCourses: (params) => http.get('/courses', { params }),
  // 获取单个课程详情
  getCourse: (id) => {
    // 确保 ID 是字符串，并移除可能的空格
    const courseId = String(id).trim()
    console.log('API getCourse 调用 - courseId:', courseId)
    return http.get(`/courses/${courseId}`)
  },
  // 创建课程
  createCourse: (courseData) => http.post('/courses', courseData),
  // 更新课程
  updateCourse: (id, courseData) => http.put(`/courses/${id}`, courseData),
  // 提交课程发布审批
  publishCourse: (id) => {
    // 确保 ID 是字符串，并移除可能的空格
    const courseId = String(id).trim()
    console.log('API publishCourse 调用 - courseId:', courseId)
    return http.post(`/courses/${courseId}/publish`)
  },
  // 删除课程
  deleteCourse: (id) => http.delete(`/courses/${id}`)
};

// 成员管理API
export const memberAPI = {
  // 获取成员列表
  getMembers: (params) => http.get('/members', { params }),
  // 获取成员详情
  getMember: (id) => http.get(`/members/${id}`),
  // 创建成员
  createMember: (memberData) => http.post('/members', memberData),
  // 更新成员信息
  updateMember: (id, memberData) => http.put(`/members/${id}`, memberData),
  // 删除成员
  deleteMember: (id) => http.delete(`/members/${id}`),
  // 更新成员状态
  updateMemberStatus: (id, status) => http.patch(`/members/${id}/status`, { status })
};

// 活动管理API
export const activityAPI = {
  // 获取活动列表
  getActivities: (params) => http.get('/activities', { params }),
  // 获取活动详情
  getActivity: (id) => http.get(`/activities/${id}`),
  // 创建活动
  createActivity: (activityData) => http.post('/activities', activityData),
  // 更新活动
  updateActivity: (id, activityData) => http.put(`/activities/${id}`, activityData),
  // 删除活动
  deleteActivity: (id) => http.delete(`/activities/${id}`)
};

// 仪表盘统计API
export const dashboardAPI = {
  // 获取仪表盘统计数据（管理员指标）
  getDashboardStats: () => http.get('/admin/metrics'),
  // 获取最近活动
  getRecentActivities: () => http.get('/dashboard/overview'),
  // 获取待处理任务
  getPendingTasks: () => http.get('/dashboard/overview')
};

// 系统设置API
export const settingsAPI = {
  // 获取系统设置
  getSettings: () => http.get('/admin/system/settings'),
  // 更新系统设置
  updateSettings: (settingsData) => http.put('/admin/system/settings', settingsData)
};

// 审批管理API
export const approvalAPI = {
  // 获取审批列表
  getApprovals: (params) => http.get('/admin/approvals', { params }),
  // 处理审批决定（批准或拒绝）
  decideApproval: (requestId, decisionData) => http.post(`/admin/approvals/${requestId}/decision`, decisionData)
};

export default {
  authAPI,
  userAPI,
  courseAPI,
  memberAPI,
  activityAPI,
  dashboardAPI,
  settingsAPI,
  userPreferencesAPI,
  approvalAPI
};