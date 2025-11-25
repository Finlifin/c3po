<script setup lang="ts">
import router from '../router'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import TeacherSidebar from '../components/TeacherSidebar.vue'

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

// Load user info and courses on mount
onMounted(async () => {
  await fetchUserInfo()
  if (user.value?.id) {
    await fetchCourses()
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
          <div class="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <h1>教师仪表板</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <div class="avatar">{{ user?.username.charAt(0) }}</div>
            <span class="username">{{ user?.username }}</span>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="welcome-section">
          <h2>欢迎回来，{{ user?.username }}教授！</h2>
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
                <button class="manage-btn">管理课程</button>
                <button class="assign-btn">布置作业</button>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-dashboard {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  overflow-x: hidden;
}

.sidebar {
  width: 280px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Removed padding: 20px that caused blank space */
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  margin-bottom: 20px;
  padding: 20px;
}

.sidebar-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 20px 20px 20px;
}

.sidebar-header {
  margin-bottom: 20px;
}

.sidebar-header .logo {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.sidebar-header .logo img {
  width: 60px;
  height: 60px;
}

.sidebar-header .logo h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.sidebar-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  opacity: 0.9;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.2);
  opacity: 1;
}

.menu-item.active {
  background-color: rgba(255, 255, 255, 0.3);
  opacity: 1;
}

.header {
  background-color: white;
  color: black;
  padding: 15px 30px;
  width: 80%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left .logo img {
  width: 60px;
  height: 60px;
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
  display: block;
  font-weight: 600;
  font-size: 1.1rem;
}

.user-info .email {
  display: block;
  font-size: 0.9rem;
  opacity: 0.9;
}

.logout-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.main-content {
  flex: 1;
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
    width: calc(100vw - 60px);
  }
}

.content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 90%;
}

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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.card {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 3rem;
}

.card-content h3 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.card-content p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
  line-height: 1.5;
}

.card-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.card-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
}

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

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.course-card {
  background-color: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
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

.tasks-section {
  margin-top: 30px;
}

.task-item {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
}

.task-icon {
  font-size: 2rem;
  color: #667eea;
}

.task-content {
  flex: 1;
}

.task-title {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  margin-bottom: 5px;
}

.task-meta {
  font-size: 0.9rem;
  color: #666;
}

.task-btn {
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

.task-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .header-left, .header-right {
    width: 100%;
    justify-content: center;
  }
  
  .user-info {
    text-align: center;
  }
  
  .content {
    padding: 15px;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>