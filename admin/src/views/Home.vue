<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 角色卡片数据
const roles = [
  {
    icon: '👨‍🎓',
    title: '学生',
    description: '浏览课程、在线学习、提交作业、查询成绩，享受便捷的学习体验',
    loginPath: '/?role=student'
  },
  {
    icon: '👨‍🏫',
    title: '教师',
    description: '管理课程、布置作业、批改作业、录入成绩，高效管理教学活动',
    loginPath: '/?role=teacher'
  },
  {
    icon: '👨‍💼',
    title: '管理员',
    description: '用户管理、课程审核、数据统计、系统设置，全面管理平台运营',
    loginPath: '/?role=admin'
  }
]

// 特色功能数据
const features = [
  {
    icon: '📚',
    title: '智能课程管理',
    description: '支持多媒体课程内容，智能推荐学习路径'
  },
  {
    icon: '📝',
    title: '作业管理系统',
    description: '在线布置、提交、批改作业，实时反馈学习效果'
  },
  {
    icon: '📊',
    title: '成绩统计分析',
    description: '多维度成绩分析，可视化学习进度跟踪'
  },
  {
    icon: '🔒',
    title: '安全可靠',
    description: '数据加密传输，权限隔离，保障信息安全'
  },
  {
    icon: '📱',
    title: '多端协同',
    description: '支持PC、平板、手机多设备访问'
  },
  {
    icon: '⚡',
    title: '高效响应',
    description: '优化性能，支持高并发，响应时间小于2秒'
  }
]

// 跳转到角色登录页
const goToLogin = (path) => {
  router.push(path)
}

// 平滑滚动到指定区域
const scrollToRoles = () => {
  const rolesSection = document.getElementById('roles')
  if (rolesSection) {
    rolesSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
}
</script>

<template>
  <div class="home-page">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="container">
        <div class="navbar-content">
          <a href="#" class="navbar-brand" @click.prevent>智慧学习平台</a>
          <ul class="navbar-nav">
            <li><a href="#" class="nav-link" @click.prevent>首页</a></li>
            <li><a href="#" class="nav-link" @click.prevent="goToLogin('/?role=student')">学生登录</a></li>
            <li><a href="#" class="nav-link" @click.prevent="goToLogin('/?role=teacher')">教师登录</a></li>
            <li><a href="#" class="nav-link" @click.prevent="goToLogin('/?role=admin')">管理员登录</a></li>
          </ul>
        </div>
      </div>
    </nav>

    <main>
      <!-- Hero 区域 -->
      <section class="hero">
        <div class="container">
          <h1>大学生智慧学习平台</h1>
          <p>为大学生、教师和管理员提供高效、智能的学习与管理环境，实现课程学习、作业管理、成绩查询、数据统计等功能</p>
          <a href="#roles" class="btn btn-primary btn-lg" @click.prevent="scrollToRoles">开始使用</a>
        </div>
      </section>

      <!-- 角色选择区域 -->
      <section class="container" id="roles">
        <h2 class="text-center mb-4">选择您的身份</h2>
        <div class="role-cards">
          <div 
            v-for="(role, index) in roles" 
            :key="index"
            class="role-card"
          >
            <div class="role-icon">{{ role.icon }}</div>
            <h3 class="role-title">{{ role.title }}</h3>
            <p class="role-description">{{ role.description }}</p>
            <a 
              href="#" 
              class="btn btn-primary w-full" 
              @click.prevent="goToLogin(role.loginPath)"
            >
              {{ role.title }}登录
            </a>
          </div>
        </div>
      </section>

      <!-- 平台特色功能 -->
      <section class="features">
        <div class="container">
          <h2>平台特色功能</h2>
          <div class="feature-grid">
            <div 
              v-for="(feature, index) in features" 
              :key="index"
              class="feature-item"
            >
              <div class="feature-icon">{{ feature.icon }}</div>
              <h4>{{ feature.title }}</h4>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 大学生智慧学习平台. 保留所有权利.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 导航栏样式 */
.navbar {
  background: #ffffff;
  border-bottom: 1px solid #d1d1d6;
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.8);
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
  text-decoration: none;
}

.navbar-nav {
  display: flex;
  list-style: none;
  gap: 24px;
  align-items: center;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: #86868b;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  cursor: pointer;
}

.nav-link:hover,
.nav-link.active {
  color: #007aff;
}

/* Hero 区域 */
.hero {
  background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
  color: white;
  padding: 64px 0;
  text-align: center;
  margin-bottom: 64px;
}

.hero h1 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hero p {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* 容器 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  gap: 8px;
}

.btn-primary {
  background-color: #007aff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056cc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-lg {
  padding: 16px 32px;
  font-size: 18px;
  min-height: 52px;
}

.w-full {
  width: 100%;
}

/* 角色卡片 */
.role-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.role-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #d1d1d6;
}

.role-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.role-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #007aff, #5856d6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
}

.role-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1d1d1f;
}

.role-description {
  color: #86868b;
  margin-bottom: 24px;
  line-height: 1.6;
}

/* 特色功能区域 */
.features {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  margin: 32px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.features h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #1d1d1f;
  font-size: 32px;
  font-weight: 700;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.feature-item {
  text-align: center;
  padding: 24px;
}

.feature-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #007aff;
}

.feature-item h4 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1d1d1f;
}

.feature-item p {
  color: #86868b;
  line-height: 1.6;
  margin: 0;
}

/* 页脚 */
.footer {
  background: #1d1d1f;
  color: white;
  text-align: center;
  padding: 32px 0;
  margin-top: 32px;
}

.footer p {
  margin: 0;
}

/* 工具类 */
.text-center {
  text-align: center;
}

.mb-4 {
  margin-bottom: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-content {
    flex-direction: column;
    gap: 16px;
  }

  .navbar-nav {
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
  }

  .hero h1 {
    font-size: 32px;
  }

  .hero p {
    font-size: 16px;
  }

  .role-cards {
    grid-template-columns: 1fr;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 16px;
  }
}
</style>

