import http from './http';
import { handleApiError } from './errorHandler';

// 认证相关API
export const authAPI = {
  // 登录
  login: (credentials) => http.post('/auth/login', credentials).catch(error => handleApiError(error, '登录')),
  // 注册
  register: (userData) => http.post('/auth/register', userData).catch(error => handleApiError(error, '注册')),
  // 获取当前用户信息
  getProfile: () => http.get('/auth/me').catch(error => handleApiError(error, '获取用户信息')),
  // 登出
  logout: () => http.post('/auth/logout').catch(error => handleApiError(error, '登出')),
  // 刷新token
  refreshToken: () => http.post('/auth/refresh').catch(error => handleApiError(error, '刷新令牌')),
  // 修改密码
  changePassword: (passwordData) => http.patch('/users/me/password', passwordData).catch(error => handleApiError(error, '修改密码'))
};

// 用户偏好设置API
export const userPreferencesAPI = {
  // 获取用户偏好设置
  getPreferences: () => http.get('/users/me/preferences').catch(error => handleApiError(error, '获取用户偏好设置')),
  // 更新用户偏好设置
  updatePreferences: (preferencesData) => http.patch('/users/me/preferences', preferencesData).catch(error => handleApiError(error, '更新用户偏好设置'))
};

// 用户管理API
export const userAPI = {
  // 获取用户列表
  getUsers: (params) => http.get('/admin/users', { params }).catch(error => handleApiError(error, '获取用户列表')),
  // 获取单个用户信息
  getUser: (id) => http.get(`/admin/users/${id}`).catch(error => handleApiError(error, '获取单个用户信息')),
  // 创建用户
  createUser: (userData) => http.post('/admin/users', userData).catch(error => handleApiError(error, '创建用户')),
  // 批量创建用户
  bulkCreateUsers: (usersData) => http.post('/admin/users', usersData).catch(error => handleApiError(error, '批量创建用户')),
  // 更新用户信息
  updateUser: (id, userData) => http.patch(`/admin/users/${id}`, userData).catch(error => handleApiError(error, '更新用户信息')),
  // 删除用户
  deleteUser: (id) => http.delete(`/admin/users/${id}`).catch(error => handleApiError(error, '删除用户')),
  // 更新用户状态
  updateUserStatus: (id, payload) => http.put(`/admin/users/${id}/status`, payload).catch(error => handleApiError(error, '更新用户状态'))
};

// 课程管理API
export const courseAPI = {
  // 获取课程列表
  getCourses: (params) => http.get('/courses', { params }).catch(error => handleApiError(error, '获取课程列表')),
  // 获取单个课程详情
  getCourse: (id) => {
    // 确保 ID 是字符串，并移除可能的空格
    const courseId = String(id).trim()
    console.log('API getCourse 调用 - courseId:', courseId)
    return http.get(`/courses/${courseId}`).catch(error => handleApiError(error, '获取单个课程详情'))
  },
  // 创建课程
  createCourse: (courseData) => http.post('/courses', courseData).catch(error => handleApiError(error, '创建课程')),
  // 更新课程
  updateCourse: (id, courseData) => http.put(`/courses/${id}`, courseData).catch(error => handleApiError(error, '更新课程')),
  // 提交课程发布审批
  publishCourse: (id) => {
    // 确保 ID 是字符串，并移除可能的空格
    const courseId = String(id).trim()
    console.log('API publishCourse 调用 - courseId:', courseId)
    return http.post(`/courses/${courseId}/publish`).catch(error => handleApiError(error, '提交课程发布审批'))
  },
  // 删除课程
  deleteCourse: (id) => http.delete(`/courses/${id}`).catch(error => handleApiError(error, '删除课程'))
};

// 成员管理API
export const memberAPI = {
  // 获取成员列表
  getMembers: (params) => http.get('/members', { params }).catch(error => handleApiError(error, '获取成员列表')),
  // 获取成员详情
  getMember: (id) => http.get(`/members/${id}`).catch(error => handleApiError(error, '获取成员详情')),
  // 创建成员
  createMember: (memberData) => http.post('/members', memberData).catch(error => handleApiError(error, '创建成员')),
  // 更新成员信息
  updateMember: (id, memberData) => http.put(`/members/${id}`, memberData).catch(error => handleApiError(error, '更新成员信息')),
  // 删除成员
  deleteMember: (id) => http.delete(`/members/${id}`).catch(error => handleApiError(error, '删除成员')),
  // 更新成员状态
  updateMemberStatus: (id, status) => http.patch(`/members/${id}/status`, { status }).catch(error => handleApiError(error, '更新成员状态'))
};

// 活动管理API
export const activityAPI = {
  // 获取活动列表
  getActivities: (params) => http.get('/activities', { params }).catch(error => handleApiError(error, '获取活动列表')),
  // 获取活动详情
  getActivity: (id) => http.get(`/activities/${id}`).catch(error => handleApiError(error, '获取活动详情')),
  // 创建活动
  createActivity: (activityData) => http.post('/activities', activityData).catch(error => handleApiError(error, '创建活动')),
  // 更新活动
  updateActivity: (id, activityData) => http.put(`/activities/${id}`, activityData).catch(error => handleApiError(error, '更新活动')),
  // 删除活动
  deleteActivity: (id) => http.delete(`/activities/${id}`).catch(error => handleApiError(error, '删除活动'))
};

// 仪表盘统计API
export const dashboardAPI = {
  // 获取仪表盘统计数据（管理员指标）
  getDashboardStats: () => http.get('/admin/metrics').catch(error => handleApiError(error, '获取仪表盘统计数据')),
  // 获取最近活动
  getRecentActivities: () => http.get('/dashboard/overview').catch(error => handleApiError(error, '获取最近活动')),
  // 获取待处理任务
  getPendingTasks: () => http.get('/dashboard/overview').catch(error => handleApiError(error, '获取待处理任务'))
};

// 系统设置API
export const settingsAPI = {
  // 获取系统设置
  getSettings: () => http.get('/admin/system/settings').catch(error => handleApiError(error, '获取系统设置')),
  // 更新系统设置
  updateSettings: (settingsData) => http.put('/admin/system/settings', settingsData).catch(error => handleApiError(error, '更新系统设置'))
};

// 审批管理API
export const approvalAPI = {
  // 获取审批列表
  getApprovals: (params) => http.get('/admin/approvals', { params }).catch(error => handleApiError(error, '获取审批列表')),
  // 处理审批决定（批准或拒绝）
  decideApproval: (requestId, decisionData) => http.post(`/admin/approvals/${requestId}/decision`, decisionData).catch(error => handleApiError(error, '处理审批决定'))
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