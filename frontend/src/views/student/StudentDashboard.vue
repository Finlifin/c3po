<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import StudentSidebar from '../../components/StudentSidebar.vue'

// User data
const user = ref<any>(null)
const error = ref('')

// API configuration
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

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
    router.push('/student')
  }
}

// Handle logout
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('expiresIn')
  router.push('/student')
}

// Load user info on mount
onMounted(() => {
  fetchUserInfo()
})
</script>

<template>
  <div class="student-dashboard">
    <!-- 左侧菜单栏 -->
    <StudentSidebar activeMenu="dashboard" @logout="logout" />
    
    <!-- 右侧主内容 -->
    <div class="main-content">
      <div class="header">
        <div class="header-left">
          <div class="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="username">{{ user?.username }}</span>
            <span class="email">{{ user?.email }}</span>
          </div>
        </div>
      </div>
      
      <div class="content">
        <div class="welcome-section">
          <h2>欢迎回来，{{ user?.username }}同学</h2>
          <p>这是您的学生仪表板，您可以在这里查看课程、作业和成绩。</p>
        </div>
        
        <div class="dashboard-grid">
          <div class="card">
            <div class="card-icon">📚</div>
            <div class="card-content">
              <h3>我的课程</h3>
              <p>查看当前学习的课程</p>
              <button class="card-btn">进入课程</button>
            </div>
          </div>
          
          <div class="card">
            <div class="card-icon">📝</div>
            <div class="card-content">
              <h3>我的作业</h3>
              <p>查看和提交作业</p>
              <button class="card-btn">查看作业</button>
            </div>
          </div>
          
          <div class="card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <h3>我的成绩</h3>
              <p>查看考试和作业成绩</p>
              <button class="card-btn">查看成绩</button>
            </div>
          </div>
          
          <div class="card">
            <div class="card-icon">💬</div>
            <div class="card-content">
              <h3>我的消息</h3>
              <p>查看教师和系统消息</p>
              <button class="card-btn">查看消息</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-dashboard {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  overflow: hidden;
}

/* 左侧菜单栏 */
.sidebar {
  width: 280px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.sidebar-header .logo {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.sidebar-header .logo img {
  width: 50px;
  height: 50px;
}

.sidebar-header h1 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.sidebar-menu {
  padding: 20px 0;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.menu-item:hover {
  background-color: #f0f0f0;
  border-left-color: #667eea;
}

.menu-item.active {
  background-color: rgba(102, 126, 234, 0.1);
  border-left-color: #667eea;
  font-weight: 600;
}

.menu-icon {
  font-size: 1.2rem;
}

.menu-text {
  font-size: 0.95rem;
  color: #333;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  width: calc(100vw - 280px);
}

.main-content .header {
  background-color: white;
  color: #333;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-left .hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.header-left .hamburger span {
  width: 25px;
  height: 3px;
  background-color: #333;
  border-radius: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  text-align: right;
}

.user-info .username {
  display: block;
  font-weight: 600;
  font-size: 1.1rem;
}

.user-info .email {
  display: block;
  font-size: 0.9rem;
  opacity: 0.7;
}

.content {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    width: 100vw;
  }
  
  .header-left .hamburger {
    display: flex;
  }
  
  .content {
    padding: 15px;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>