<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const features = [
  {
    icon: '📚',
    title: '智能课程管理',
    description: '支持多媒体课程内容，智能推荐学习路径'
  },
  {
    icon: '✍️',
    title: '作业管理系统',
    description: '在线布置、提交、批改作业，实时反馈学习效果'
  },
  {
    icon: '📊',
    title: '成绩统计分析',
    description: '多维度成绩统计，可视化学习进度跟踪'
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
    description: '优化性能，支持高并发，快速响应'
  }
]
</script>

<template>
  <div class="home-page">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="container">
        <div class="nav-content">
          <div class="nav-brand">
            <div class="brand-icon">🎓</div>
            <h1>C3PO</h1>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container hero-container">
        <div class="hero-content">
          <h1 class="hero-title">
            智慧学习平台
            <span class="gradient-text">让教育更高效</span>
          </h1>
          <p class="hero-description">
            为大学生和教师提供高效、智能的学习与管理环境<br/>
            实现课程学习、作业管理、成绩查询、数据统计等功能
          </p>
          
          <div class="role-cards">
            <div class="role-card student-card" @click="router.push('/auth/student/login')">
              <div class="role-icon">👨‍🎓</div>
              <h3>学生登录</h3>
              <p>浏览课程、提交作业、查询成绩</p>
              <div class="card-arrow">→</div>
            </div>
            
            <div class="role-card teacher-card" @click="router.push('/auth/teacher/login')">
              <div class="role-icon">👩‍🏫</div>
              <h3>教师登录</h3>
              <p>管理课程、批改作业、录入成绩</p>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2>平台特色功能</h2>
          <p>为教学管理提供全方位支持</p>
        </div>
        
        <div class="features-grid">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="feature-card"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>© 2025 C3PO 智慧学习平台. 保留所有权利</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
}

/* Navbar */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand-icon {
  font-size: 2rem;
  line-height: 1;
}

.nav-brand h1 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) 0;
  text-align: center;
  flex: 1;
}

.hero-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: var(--space-6);
  color: var(--text-primary);
}

.gradient-text {
  display: block;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-12);
  line-height: 1.8;
}

/* Role Cards */
.role-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
  max-width: 700px;
  margin: 0 auto;
}

.role-card {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.role-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transform: scaleX(0);
  transition: transform var(--transition-base);
}

.role-card:hover::before {
  transform: scaleX(1);
}

.role-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary);
}

.role-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
  line-height: 1;
}

.role-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--space-2);
  color: var(--text-primary);
}

.role-card p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: var(--space-4);
}

.card-arrow {
  font-size: 1.5rem;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all var(--transition-base);
}

.role-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Features Section */
.features-section {
  padding: var(--space-16) 0;
  background: white;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}

.section-header p {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

.feature-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: all var(--transition-base);
}

.feature-card:hover {
  background: white;
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
  line-height: 1;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Footer */
.footer {
  background: var(--gray-900);
  color: white;
  padding: var(--space-8) 0;
  text-align: center;
}

.footer p {
  margin: 0;
  color: var(--gray-400);
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-section {
    padding: var(--space-12) 0;
  }

  .role-cards {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .section-header h2 {
    font-size: 2rem;
  }
}
</style>