<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import StudentSidebar from '../../components/StudentSidebar.vue'
import { onMounted, ref } from 'vue'

// 学生课程响应数据类型
interface StudentCourseResponse {
  courseId: string
  name: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  selectionStatus: 'ENROLLED' | 'PENDING' | 'DROPPED'
  selectedAt: string
  pendingAssignments: number
  completedAssignments: number
  totalAssignments: number
}

// 用户信息类型
interface UserInfo {
  id: string
  username: string
  role: string
}

// 状态变量
const courses = ref<StudentCourseResponse[]>([])
const userInfo = ref<UserInfo | null>(null)
const loading = ref(false)
const error = ref('')

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 获取token
const getToken = () => {
  return localStorage.getItem('token')
}

// 检查token有效性
const checkAuth = () => {
  const token = getToken()
  console.log('检查认证状态，token存在:', !!token)
  if (!token) {
    // 在开发环境下不自动跳转，便于调试
    if (import.meta.env.DEV) {
      console.log('开发环境：未找到token，但不跳转')
      return false
    }
    router.push('/student')
    return false
  }
  return true
}

// 处理退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/student')
}

// 获取用户信息
const fetchUserInfo = async () => {
  if (!checkAuth()) return
  
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    // 直接使用response.data获取用户信息，无需嵌套的data属性
    userInfo.value = response.data
    return userInfo.value
  } catch (err: any) {
    console.error('Failed to fetch user info:', err)
    error.value = '获取用户信息失败'
    return null
  }
}

// 获取学生已选课程
const fetchEnrolledCourses = async () => {
  const isAuthenticated = checkAuth()
  console.log('开始获取课程数据，认证状态:', isAuthenticated)
  
  loading.value = true
  error.value = ''
  
  try {
    // 先获取用户信息以获取studentId
    const user = await fetchUserInfo()
    if (!user) {
      // 无法获取用户信息，直接抛出错误
      throw new Error('无法获取用户信息')
    }
    
    const token = getToken()
    console.log('准备发送API请求:', `${API_BASE_URL}/students/${user.id}/courses`)
    const response = await axios.get(`${API_BASE_URL}/students/${user.id}/courses`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    // 检查响应数据格式，确保能正确提取课程数组
    console.log('API请求成功，返回数据:', response.data)
    let courseData: StudentCourseResponse[] = []
    
    // 如果response.data本身是数组，直接使用
    if (Array.isArray(response.data)) {
      courseData = response.data
    } 
    // 否则尝试从response.data.data中获取数组（常见的REST API格式）
    else if (response.data && Array.isArray(response.data.data)) {
      courseData = response.data.data
    }
    // 或者尝试从response.data.courses中获取数组
    else if (response.data && Array.isArray(response.data.courses)) {
      courseData = response.data.courses
    }
    
    // 只保留selectionStatus为ENROLLED的课程
    courses.value = courseData.filter((course: StudentCourseResponse) => 
      course.selectionStatus === 'ENROLLED'
    )
    
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('Failed to fetch enrolled courses:', err)
  } finally {
    loading.value = false
    console.log('获取课程数据完成，加载状态:', loading.value)
  }
}

// 跳转到课程学习页面
const learnCourse = (courseId: string) => {
  router.push(`/student/courses/${courseId}`)
}

// 跳转到作业/测试列表页面
const viewAssignments = (courseId: string) => {
  router.push(`/student/courses/${courseId}/assignments`)
}

// 页面加载时获取数据
onMounted(() => {
  fetchEnrolledCourses()
})

// 计算作业完成率
const getCompletionRate = (course: StudentCourseResponse): string => {
  if (course.totalAssignments === 0) return '0%'
  return `${Math.round((course.completedAssignments / course.totalAssignments) * 100)}%`
}

// 获取课程状态样式类名
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'PUBLISHED':
      return 'status-published'
    case 'DRAFT':
      return 'status-draft'
    case 'PENDING_REVIEW':
      return 'status-pending'
    case 'ARCHIVED':
      return 'status-archived'
    default:
      return ''
  }
}

// 获取课程状态显示文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'PUBLISHED':
      return '已发布'
    case 'DRAFT':
      return '草稿'
    case 'PENDING_REVIEW':
      return '审核中'
    case 'ARCHIVED':
      return '已归档'
    default:
      return status
  }
}
</script>

<template>
  <div class="my-courses">
    <!-- 左侧菜单栏 -->
    <StudentSidebar activeMenu="courses" @logout="logout" />
    
    <div class="main-content">
      <div class="content">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1>我的课程</h1>
          <p v-if="userInfo">
            欢迎，{{ userInfo.username }}！以下是您当前选修的课程列表。
          </p>
        </div>
        <!-- 加载状态和错误提示 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载课程信息...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <p class="error-message">{{ error }}</p>
          <button class="retry-btn" @click="fetchEnrolledCourses">重新加载</button>
        </div>
        <!-- 课程列表 -->
        <div v-else-if="courses.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>暂无选修课程</h3>
          <p>您还没有选修任何课程，请前往选课页面浏览并选择课程。</p>
          <button class="go-selection-btn" @click="router.push('/student/course-selection')">
            去选课
          </button>
        </div>
        <div v-else class="courses-container">
          <div 
            v-for="course in courses" 
            :key="course.courseId"
            class="course-card"
          >
            <div class="course-header">
              <h3 class="course-name">{{ course.name }}</h3>
              <span :class="['course-status', getStatusClass(course.status)]">
                {{ getStatusText(course.status) }}</span>
            </div>
            <div class="course-body">
              <div class="course-meta">
                <div class="meta-item">
                  <span class="meta-icon">📅</span>
                  <span class="meta-label">选课时间:</span>
                  <span class="meta-value">{{ new Date(course.selectedAt).toLocaleDateString() }}</span>
                </div>
              </div>
              <div class="assignment-stats">
                <h4>作业完成情况</h4>
                <div v-if="course.totalAssignments === 0" class="no-assignments">
                  <p>暂无作业</p>
                </div>
                <template v-else>
                  <div class="stats-row">
                    <div class="stat-item">
                      <span class="stat-label">待完成:</span>
                      <span class="stat-value pending">{{ course.pendingAssignments }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">已完成:</span>
                      <span class="stat-value completed">{{ course.completedAssignments }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">总计:</span>
                      <span class="stat-value total">{{ course.totalAssignments }}</span>
                    </div>
                  </div>
                  <div class="completion-rate">
                    <div class="rate-bar">
                      <div 
                        class="rate-fill" 
                        :style="{ width: getCompletionRate(course) }"
                      ></div>
                    </div>
                    <span class="rate-text">完成率: {{ getCompletionRate(course) }}</span>
                  </div>
                </template>
              </div>
            </div>
            <div class="course-footer">
              <button 
                class="learn-btn" 
                @click="learnCourse(course.courseId)"
                :disabled="course.status !== 'PUBLISHED'"
              >
                <span v-if="course.status === 'PUBLISHED'">学习课程</span>
                <span v-else>课程未发布</span>
              </button>
              <button 
                class="assignments-btn" 
                @click="viewAssignments(course.courseId)"
                :disabled="course.status !== 'PUBLISHED' || course.totalAssignments === 0"
              >
                查看作业/测试
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-courses {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  overflow: hidden;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  margin-left: 280px; /* 与侧边栏宽度一致 */
  display: flex;
  flex-direction: column;
  width: calc(100vw - 280px);
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content {
  padding: 30px;
  width: 100%;
  box-sizing: border-box;
}

/* 页面标题 */
.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.page-header p {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.error-message {
  font-size: 1.1rem;
  color: #e74c3c;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.retry-btn:hover {
  background-color: #5568d3;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 10px 0;
}

.empty-state p {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 20px 0;
  max-width: 500px;
}

.go-selection-btn {
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.go-selection-btn:hover {
  background-color: #5568d3;
}

/* 课程容器 */
.courses-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

/* 课程卡片 */
.course-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.course-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
}

.course-name {
  font-size: 1.3rem;
  color: #333;
  margin: 0;
  font-weight: 600;
  flex: 1;
}

.course-status {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-published {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.status-draft {
  background-color: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.status-pending {
  background-color: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.status-archived {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.course-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.meta-icon {
  font-size: 1.1rem;
}

.meta-label {
  color: #666;
  font-weight: 500;
}

.meta-value {
  color: #333;
}

.assignment-stats {
  margin-top: auto;
}

.assignment-stats h4 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.no-assignments {
  text-align: center;
  padding: 15px 0;
  color: #9e9e9e;
  font-size: 0.95rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.stat-value.pending {
  color: #ff9800;
}

.stat-value.completed {
  color: #4caf50;
}

.stat-value.total {
  color: #667eea;
}

.completion-rate {
  margin-top: 10px;
}

.rate-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.rate-text {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.course-footer {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.learn-btn {
  padding: 10px 24px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
}

.learn-btn:hover:not(:disabled) {
  background-color: #5568d3;
  transform: translateY(-2px);
}

.learn-btn:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
  transform: none;
}

.assignments-btn {
  padding: 10px 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assignments-btn:hover:not(:disabled) {
  background-color: #43a047;
  transform: translateY(-2px);
}

.assignments-btn:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .courses-container {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
  }
  
  .content {
    padding: 15px;
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .courses-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .stats-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style>