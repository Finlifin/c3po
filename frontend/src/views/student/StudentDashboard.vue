<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import StudentSidebar from '../../components/StudentSidebar.vue'

// User data
const user = ref<any>(null)
const error = ref('')
// Todo data
const todos = ref<any[]>([])
const loading = ref(false)

// API configuration
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// Fetch user information
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('Stoken')
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
    localStorage.removeItem('Stoken')
    localStorage.removeItem('StokenType')
    localStorage.removeItem('SexpiresIn')
    router.push('/student')
  }
}

// Fetch todos
const fetchTodos = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('Stoken')
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
  } finally {
    loading.value = false
  }
}

// Handle logout
const logout = () => {
  localStorage.removeItem('Stoken')
  localStorage.removeItem('StokenType')
  localStorage.removeItem('SexpiresIn')
  router.push('/student')
}

// Load data on mount
onMounted(async () => {
  await fetchUserInfo()
  await fetchTodos()
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
          <div class="notification-icon" @click="router.push('/student/notifications')">
            <span class="icon">🔔</span>
          </div>
          <div class="user-info">
            <div class="avatar">{{ user?.username.charAt(0) }}</div>
            <div class="user-details">
              <span class="username">{{ user?.username }}</span>
              <span class="email">{{ user?.email }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="content">
        <div class="welcome-section">
          <h2>欢迎回来，{{ user?.username }}同学</h2>
          
        </div>
        
        <div class="todos-section">
          <h3>我的待办事项</h3>
          
          <div v-if="loading" class="loading">
            <p>加载中...</p>
          </div>
          
          <div v-else-if="error" class="error">
            <p>{{ error }}</p>
          </div>
          
          <div v-else-if="todos.length === 0" class="empty">
            <p>暂无待办事项</p>
          </div>
          
          <div v-else class="todos-grid">
            <div 
              v-for="todo in todos" 
              :key="todo.id" 
              class="todo-card"
              :class="todo.status"
              @click="router.push(`/student/assignments/${todo.id}/submit`)"
              style="cursor: pointer;"
            >
              <div class="todo-header">
                <h4>{{ todo.title }}</h4>
                <span class="todo-status">{{ todo.status === 'pending' ? '待完成' : '已提交' }}</span>
              </div>
              <div class="todo-content">
                <!-- <p class="todo-description">{{ todo.description }}</p> -->
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
.student-dashboard {
  width: 114%;
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
  margin-left: 110px;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.main-content .header {
  background-color: white;
  color: #333;
  padding: 15px 30px;
  width: 1300px;
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

.notification-icon {
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
  position: relative;
}

.notification-icon:hover {
  color: #667eea;
  transform: scale(1.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
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
  font-size: 1.1rem;
}

.user-details {
  text-align: left;
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
  margin-left: 30px;
  padding: 30px;
  max-width: 1300px;

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

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 1rem;
}

.error {
  color: #e74c3c;
}

.todos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.todo-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 2px solid #e0e0e0;
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
  
  .todos-grid {
    grid-template-columns: 1fr;
  }
}
</style>