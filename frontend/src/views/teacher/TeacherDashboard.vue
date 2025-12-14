<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import TeacherSidebar from '../../components/TeacherSidebar.vue'

// User data
const user = ref<any>(null)
const error = ref('')

// API configuration
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// Course data
interface Course {
  id: string;
  name: string;
  semester: string;
  credit: number;
  enrollLimit: number;
  teacherId: string;
  metrics: {
    enrolledCount: number;
    modules: number;
  };
}

const courses = ref<Course[]>([])
const isLoadingCourses = ref(true)
const totalCourses = ref(0)

// Todo data
const todos = ref<any[]>([])
const isLoadingTodos = ref(false)



// Fetch user information
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录')
    }
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    user.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取用户信息失败'
    // Redirect to login if token is invalid
    localStorage.removeItem('token')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('expiresIn')
    router.push('/teacher')
  }
}

// Fetch courses
const fetchCourses = async () => {
  try {
    isLoadingCourses.value = true
    const token = localStorage.getItem('token')
    if (!token || !user.value?.id) {
      throw new Error('未登录或用户信息不全')
    }
    
    const response = await axios.get(`${API_BASE_URL}/courses`, {
      params: {
        teacherId: user.value.id
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    // 解析API响应结构
    courses.value = response.data.data || []
    totalCourses.value = response.data.meta.total || 0
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('获取课程列表失败:', err)
  } finally {
    isLoadingCourses.value = false
  }
}

// Handle logout
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('expiresIn')
  router.push('/teacher')
}

// Fetch todos
const fetchTodos = async () => {
  try {
    isLoadingTodos.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录')
    }
    
    const response = await axios.get(`${API_BASE_URL}/todos`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    todos.value = response.data.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取待办事项失败'
    console.error('获取待办事项失败:', err)
  } finally {
    isLoadingTodos.value = false
  }
}

// 进入课程资源页面
const goToCourseResources = (courseId: string) => {
  router.push(`/teacher/courses/${courseId}`)
}

// 进入发布作业页面
const goToPublishAssignment = (courseId: string) => {
  router.push(`/teacher/courses/${courseId}/assignments/new`)
}



// Load user info and courses on mount
onMounted(async () => {
  await fetchUserInfo()
  if (user.value?.id) {
    await Promise.all([fetchCourses(), fetchTodos()])
  }
})
</script>

<template>
  <div class="teacher-dashboard">
    <!-- 左侧菜单栏 -->
    <TeacherSidebar activeMenu="dashboard" />

    <!-- 右侧主内容 -->
    <div class="main-content">
      <div class="header">
        <div class="header-left">
          <h1>教师仪表板</h1>
        </div>
        <div class="header-right">
          <div class="notification-icon" @click="router.push('/teacher/notifications')">
            <span class="icon">🔔</span>
          </div>
          <div class="user-info">
            <div class="avatar">{{ user?.username.charAt(0) }}</div>
            <span class="username">{{ user?.username }}</span>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="welcome-section">
          <h2>欢迎回来，{{ user?.username }}老师！</h2>
          <p>这是您的教师仪表板，您可以在这里管理课程、学生和作业。</p>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ totalCourses }}</div>
            <div class="stat-label">开课数</div>
          </div>
        </div>

        <!-- 我的课程 -->
        <div class="courses-section">
          <h3>我的课程</h3>
          <div class="courses-grid">
            <div v-if="isLoadingCourses" class="loading">加载中...</div>
            <div v-else-if="courses.length === 0" class="empty-courses">
              <p>暂无课程</p>
            </div>
            <div 
              v-for="course in courses" 
              :key="course.id"
              class="course-card"
            >
              <div class="course-header">
                <h4>{{ course.name }}</h4>
                <span class="semester">{{ course.semester }}</span>
              </div>
              <div class="course-stats">
                <div class="stat-item">
                  <span class="stat-icon">👥</span>
                  <span class="stat-value">{{ course.metrics?.enrolledCount || 0 }}</span>
                  <span class="stat-text">学生数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">📚</span>
                  <span class="stat-value">{{course.metrics?.modules || 0}}</span>
                  <span class="stat-text">章节数</span>
                </div>
              </div>
              <div class="course-buttons">
                <button class="manage-btn" @click="goToCourseResources(course.id)">管理课程</button>
                <button class="assign-btn" @click="goToPublishAssignment(course.id)">布置作业</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的待办事项 -->
        <div class="todos-section">
          <h3>我的待办事项</h3>
          <div v-if="isLoadingTodos" class="loading">加载中...</div>
          <div v-else-if="todos.length === 0" class="empty-todos">
            <p>暂无待办事项</p>
          </div>
          <div v-else class="todos-grid">
            <div 
              v-for="todo in todos" 
              :key="todo.id"
              class="todo-card"
              :class="todo.status"
              @click="router.push(`/teacher/assignments/${todo.id}/submissions`)"
              style="cursor: pointer;"
            >
              <div class="todo-header">
                <h4>{{ todo.title }}</h4>
                <span class="todo-status">{{ todo.status === 'pending' ? '待完成' : '已完成' }}</span>
              </div>
              <div class="todo-content">
                <p class="todo-description">{{ todo.description }}</p>
                <div class="todo-meta">
                  <span class="todo-type">{{ todo.type }}</span>
                  <span class="todo-due">截止日期: {{ new Date(todo.dueAt).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<style scoped>
/* 主要布局样式 */
.teacher-dashboard {
  width: 85vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  overflow: hidden; /* 防止整体页面溢出 */
}

.main-content {
  flex: 1;
  margin-left: 60px; /* 适配侧边栏宽度 */
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* 头部样式 */
.header {
  background-color: white;
  color: black;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.header-left h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-icon {
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #667eea;
}

.notification-icon:hover {
  transform: scale(1.1);
  color: #764ba2;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  margin-right: 10px;
}

.user-info .username {
  font-weight: 600;
  font-size: 1.1rem;
}

/* 内容区域样式 */
.content {
  padding: 30px;
  width: 100%;
  box-sizing: border-box;
  max-width: none; /* 移除最大宽度限制，避免内容溢出 */
  margin-left: 0; /* 移除左边距，避免内容偏移 */
}

/* 欢迎区域 */
.welcome-section {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.welcome-section h2 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.welcome-section p {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

/* 统计卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* 课程部分样式 */
.courses-section {
  margin-bottom: 30px;
}

.courses-section h3 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
}

.loading, .empty-courses {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 1rem;
}

.course-card {
  background-color: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.course-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px 12px 0 0;
}

.course-header h4 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.semester {
  font-size: 0.9rem;
  opacity: 0.9;
}

.course-stats {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  background-color: #f5f5f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.stat-text {
  font-size: 0.9rem;
  color: #666;
}

.course-buttons {
  display: flex;
  gap: 10px;
  padding: 20px;
}

.manage-btn {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assign-btn {
  flex: 1;
  background-color: #e5e7eb;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.manage-btn:hover, .assign-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 待办事项样式 */
.todos-section {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.todos-section h3 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.empty-todos {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 1rem;
}

.todos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

.todo-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 2px solid #e0e0e0;
  width: 100%;
  box-sizing: border-box;
}

.todo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.todo-card.pending {
  border-color: #f39c12;
}

.todo-card.submitted {
  border-color: #27ae60;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.todo-header h4 {
  color: #333;
  font-size: 1.2rem;
  margin: 0;
  flex: 1;
}

.todo-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.todo-card.pending .todo-status {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.todo-card.submitted .todo-status {
  background-color: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.todo-content {
  color: #666;
}

.todo-description {
  font-size: 0.95rem;
  margin-bottom: 15px;
  line-height: 1.5;
}

.todo-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
}

.todo-type {
  padding: 3px 8px;
  background-color: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 6px;
  align-self: flex-start;
  text-transform: capitalize;
}

.todo-due {
  color: #888;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .header-left, .header-right {
    width: 100%;
    justify-content: center;
  }
  
  .content {
    padding: 15px;
  }
  
  .stats-grid, .courses-grid, .todos-grid {
    grid-template-columns: 1fr;
  }
}
</style>