<template>
  <div class="main-layout">
    <!-- Mobile Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-overlay"
      @click="toggleMobileMenu"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'mobile-open': isMobileMenuOpen, 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">{{ isStudent ? '🎓' : '👨‍🏫' }}</div>
          <div class="logo-text" v-show="!isSidebarCollapsed">
            <h1>C3PO</h1>
            <p>{{ isStudent ? '学生端' : '教师端' }}</p>
          </div>
        </div>
        <button class="collapse-btn" @click="toggleSidebar" v-show="!isMobileMenuOpen">
          <span>{{ isSidebarCollapsed ? '→' : '←' }}</span>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">主菜单</div>
          <a
            v-for="item in menuItems"
            :key="item.path"
            class="nav-item"
            :class="{ active: isActiveRoute(item.path) }"
            @click="navigateTo(item.path)"
            :title="isSidebarCollapsed ? item.label : ''"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" v-show="!isSidebarCollapsed">{{ item.label }}</span>
            <span v-if="item.badge && !isSidebarCollapsed" class="nav-badge">{{ item.badge }}</span>
          </a>
        </div>
        
        <div class="nav-section nav-section-bottom">
          <a class="nav-item" @click="handleLogout" :title="isSidebarCollapsed ? '退出登录' : ''">
            <span class="nav-icon">🚪</span>
            <span class="nav-label" v-show="!isSidebarCollapsed">退出登录</span>
          </a>
        </div>
      </nav>
    </aside>
    
    <!-- Main Content -->
    <div class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Top Header -->
      <header class="app-header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <span class="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <div class="page-title">
            <h2>{{ pageTitle }}</h2>
          </div>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleUserCommand" trigger="click">
            <div class="user-profile">
              <el-avatar
                v-if="hasAvatar"
                :src="avatarSrc"
                :size="40"
                class="user-avatar"
              >
                <template #error>
                  <div class="user-avatar-fallback">{{ userInitial }}</div>
                </template>
              </el-avatar>
              <div v-else class="user-avatar">{{ userInitial }}</div>
              <div class="user-details">
                <div class="user-name">{{ user?.username }}</div>
                <div class="user-role">{{ isStudent ? '学生' : '教师' }}</div>
              </div>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人信息</span>
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      
      <!-- Page Content -->
      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ArrowDown, User, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isStudent = computed(() => authStore.role === 'ROLE_STUDENT' || route.path.startsWith('/student'))
const isMobileMenuOpen = ref(false)
const isSidebarCollapsed = ref(false)

const userInitial = computed(() => {
  return user.value?.username?.charAt(0).toUpperCase() || 'U'
})

const getAvatarUrl = (avatarUrl: string | null | undefined) => {
  if (!avatarUrl) return ''
  // If avatarUrl is already a full URL, return it
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl
  }
  // Otherwise, construct OSS URL
  const ossBaseUrl = import.meta.env.VITE_OSS_BASE_URL || 'http://localhost:5000'
  return `${ossBaseUrl}/api/v1/images/${avatarUrl}`
}

const hasAvatar = computed(() => {
  const avatarUrl = user.value?.avatarUrl
  return avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 0
})

const avatarSrc = computed(() => {
  if (!hasAvatar.value) return ''
  return getAvatarUrl(user.value.avatarUrl)
})

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('dashboard')) return '仪表板'
  if (path.includes('course-selection')) return '选课中心'
  if (path.includes('course-management')) return '课程管理'
  if (path.includes('grade-management')) return '成绩管理'
  if (path.includes('courses')) return '课程'
  if (path.includes('scores')) return '成绩'
  if (path.includes('notifications')) return '通知'
  if (path.includes('assignments')) return '作业'
  if (path.includes('profile')) return '个人信息'
  return '首页'
})

const menuItems = computed(() => {
  if (isStudent.value) {
    return [
      { label: '首页', path: '/student/dashboard', icon: '🏠', badge: undefined },
      { label: '我的课程', path: '/student/courses', icon: '📚', badge: undefined },
      { label: '选课中心', path: '/student/course-selection', icon: '🎯', badge: undefined },
      { label: '成绩查询', path: '/student/scores', icon: '📊', badge: undefined },
      { label: '通知中心', path: '/student/notifications', icon: '🔔', badge: undefined },
    ]
  } else {
    return [
      { label: '首页', path: '/teacher/dashboard', icon: '🏠', badge: undefined },
      { label: '课程管理', path: '/teacher/course-management', icon: '📚', badge: undefined },
      { label: '成绩管理', path: '/teacher/grade-management', icon: '📊', badge: undefined },
      { label: '通知中心', path: '/teacher/notifications', icon: '🔔', badge: undefined },
    ]
  }
})

const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const navigateTo = (path: string) => {
  router.push(path)
  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

const handleUserCommand = (command: string) => {
  if (command === 'profile') {
    const profilePath = isStudent.value ? '/student/profile' : '/teacher/profile'
    router.push(profilePath)
  } else if (command === 'logout') {
    handleLogout()
  }
}

</script>

<style scoped>
/* Layout Structure - CSS Grid */
.main-layout {
  display: grid;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--header-height) minmax(0, 1fr);
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background-color: var(--bg-secondary);
  transition: grid-template-columns var(--transition-base);
  gap: 0;
}

/* Mobile Overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
  animation: fadeIn var(--transition-fast);
}

@media (max-width: 1024px) {
  .mobile-overlay {
    display: block;
  }
}

/* Sidebar */
.sidebar {
  grid-area: sidebar;
  background: linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  transition: transform var(--transition-base);
  box-shadow: var(--shadow-xl);
  z-index: 999;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
}

/* Sidebar Header */
.sidebar-header {
  padding: var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: white;
  flex: 1;
  min-width: 0;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar.collapsed .logo {
  justify-content: center;
}

.logo-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.logo-text h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: white;
  letter-spacing: -0.5px;
}

.logo-text p {
  font-size: 0.75rem;
  margin: 0;
  opacity: 0.8;
  color: white;
}

/* Sidebar Navigation */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: var(--space-4) 0;
}

.nav-section {
  padding: var(--space-4) 0;
}

.nav-section-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-section-title {
  padding: var(--space-2) var(--space-6);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: var(--space-2);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  text-decoration: none;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: var(--space-4);
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: white;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.nav-icon {
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
}

.nav-label {
  font-size: 0.95rem;
  font-weight: 500;
  flex: 1;
}

.nav-badge {
  padding: 0.125rem 0.5rem;
  background-color: var(--error);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-full);
}

/* App Header */
.app-header {
  grid-area: header;
  height: var(--header-height);
  min-height: var(--header-height);
  max-height: var(--header-height);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  z-index: 100;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  overflow: hidden;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  color: var(--text-primary);
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 24px;
}

.hamburger-icon span {
  display: block;
  height: 2px;
  background-color: currentColor;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.page-title h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.user-profile:hover {
  background-color: var(--gray-100);
}

.dropdown-icon {
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: transform var(--transition-fast);
}

:deep(.el-dropdown.is-opened .dropdown-icon) {
  transform: rotate(180deg);
}

.user-avatar {
  width: var(--space-10, 40px);
  height: var(--space-10, 40px);
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-lg, 1.125rem);
  flex-shrink: 0;
}

.user-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  font-weight: 600;
  font-size: var(--text-lg, 1.125rem);
  border-radius: var(--radius-full);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.2;
}

/* Page Content */
.page-content {
  grid-area: main;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  max-height: calc(100vh - var(--header-height));
  padding: var(--space-6);
  box-sizing: border-box;
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-areas:
      "header"
      "main";
    grid-template-columns: 1fr;
    grid-template-rows: var(--header-height) minmax(0, 1fr);
    height: 100vh;
    max-height: 100vh;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--sidebar-width);
    height: 100vh;
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }


  .mobile-menu-btn {
    display: block;
  }

  .collapse-btn {
    display: none !important;
  }

  .user-details {
    display: none;
  }

  .dropdown-icon {
    display: none;
  }
}

/* Sidebar collapsed state (desktop only) */
@media (min-width: 1025px) {
  .main-layout:has(.sidebar.collapsed) {
    grid-template-columns: var(--sidebar-collapsed-width, 80px) 1fr;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 var(--space-4);
  }

  .page-content {
    padding: var(--space-4);
    max-height: calc(100vh - var(--header-height));
  }

  .page-title h2 {
    font-size: 1.125rem;
  }

  .user-avatar {
    width: var(--space-9, 36px);
    height: var(--space-9, 36px);
    font-size: var(--text-base, 1rem);
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: var(--space-3);
    max-height: calc(100vh - var(--header-height));
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
