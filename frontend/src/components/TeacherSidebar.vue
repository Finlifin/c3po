<script setup lang="ts">
import router from '../router'

// 定义组件的Props
interface Props {
  activeMenu: string;
}

const props = defineProps<Props>();

// 退出登录
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenType');
  localStorage.removeItem('expiresIn');
  router.push('/teacher');
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <img src="/assets/teacher-logo.svg" alt="教师Logo">
        <h1>智慧学习平台</h1>
      </div>
    </div>
    <div class="sidebar-menu">
      <div 
        class="menu-item" 
        :class="{ active: props.activeMenu === 'dashboard' }"
        @click="router.push('/teacher/dashboard')"
      >
        <span class="menu-icon">🏠</span>
        <span class="menu-text">首页</span>
      </div>
      <div 
        class="menu-item" 
        :class="{ active: props.activeMenu === 'course-management' }"
        @click="router.push('/teacher/course-management')"
      >
        <span class="menu-icon">📚</span>
        <span class="menu-text">课程管理</span>
      </div>
      <div 
        class="menu-item" 
        :class="{ active: props.activeMenu === 'assignment-management' }"
        @click="router.push('/teacher/assignment-management')"
      >
        <span class="menu-icon">📝</span>
        <span class="menu-text">作业管理</span>
      </div>
      <div 
        class="menu-item" 
        :class="{ active: props.activeMenu === 'grade-management' }"
        @click="router.push('/teacher/grade-management')"
      >
        <span class="menu-icon">📊</span>
        <span class="menu-text">成绩管理</span>
      </div>
      <div 
        class="menu-item" 
        :class="{ active: props.activeMenu === 'student-management' }"
        @click="router.push('/teacher/student-management')"
      >
        <span class="menu-icon">👥</span>
        <span class="menu-text">学生管理</span>
      </div>
      <div 
        class="menu-item" 
        :class="{ active: props.activeMenu === 'course-resources' }"
        @click="router.push('/teacher/course-resources')"
      >
        <span class="menu-icon">🎯</span>
        <span class="menu-text">课程资源</span>
      </div>
      <div 
        class="menu-item" 
        :class="{ active: props.activeMenu === 'profile' }"
        @click="router.push('/teacher/profile')"
      >
        <span class="menu-icon">👤</span>
        <span class="menu-text">个人中心</span>
      </div>
      <div 
        class="menu-item"
        @click="logout"
      >
        <span class="menu-icon">🚪</span>
        <span class="menu-text">退出登录</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 250px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;

  z-index: 100;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .sidebar-header .logo h1 {
    display: none;
  }
  
  .menu-text {
    display: none;
  }
}
</style>