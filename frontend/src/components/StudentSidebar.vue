<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <img src="/assets/student-logo.svg" alt="学生Logo">
        <h1>智慧学习平台</h1>
      </div>
    </div>
    <div class="sidebar-menu">
      <div class="menu-item" :class="{ active: activeMenu === 'dashboard' }">
        <span class="menu-icon">🏠</span>
        <span class="menu-text">首页</span>
      </div>
      <div class="menu-item" :class="{ active: activeMenu === 'courses' }" @click="handleGotoMyCourses">
        <span class="menu-icon">📚</span>
        <span class="menu-text">我的课程</span>
      </div>
      <div class="menu-item" :class="{ active: activeMenu === 'assignments' }">
        <span class="menu-icon">📝</span>
        <span class="menu-text">作业</span>
      </div>
      <div class="menu-item" :class="{ active: activeMenu === 'grades' }">
        <span class="menu-icon">📊</span>
        <span class="menu-text">成绩</span>
      </div>
      <div class="menu-item" :class="{ active: activeMenu === 'course-selection' }" @click="handleGotoCourseSelection">
        <span class="menu-icon">🎯</span>
        <span class="menu-text">选课</span>
      </div>
      <div class="menu-item" :class="{ active: activeMenu === 'profile' }">
        <span class="menu-icon">👤</span>
        <span class="menu-text">个人中心</span>
      </div>
      <div class="menu-item" @click="handleLogout">
        <span class="menu-icon">🚪</span>
        <span class="menu-text">退出登录</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import router from '../router'

interface Props {
  activeMenu: string;
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'logout': [];
}>()

const handleGotoMyCourses = () => {
  router.push('/student/courses')
}

const handleGotoCourseSelection = () => {
  router.push('/student/course-selection')
}

const handleLogout = () => {
  emit('logout')
}
</script>

<style scoped>
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
}
</style>