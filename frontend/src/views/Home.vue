<script setup lang="ts">
import router from '../router'
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="nav-content">
        <div class="nav-logo">智慧学习平台</div>
        <div class="nav-links">
          <a href="#">首页</a>
          <a href="#student-login">学生登录</a>
          <a href="#teacher-login">教师登录</a>
        </div>
      </div>
    </div>

    <!-- 主视觉横幅 -->
    <div class="banner">
      <div class="banner-content">
        <h1>大学生智慧学习平台</h1>
        <p>为大学生和教师提供高效、智能的学习与管理环境，实现课程学习、作业管理、成绩查询、数据统计等功能</p>
        <button class="start-btn">开始使用</button>
      </div>
    </div>

    <!-- 身份选择区域 -->
    <div class="identity-section">
      <h2>选择您的身份</h2>
      <div class="identity-cards">
        <div class="card" id="student-login">
          <div class="card-icon">👨🎓</div>
          <h3>学生</h3>
          <p>浏览课程、在线学习、提交作业、查询成绩，享受便捷的学习体验</p>
          <button class="card-btn" @click="router.push('/student')">学生登录</button>
        </div>
        <div class="card" id="teacher-login">
          <div class="card-icon">👩🏫</div>
          <h3>教师</h3>
          <p>管理课程、布置作业、批改作业、录入成绩，高效管理教学活动</p>
          <button class="card-btn" @click="router.push('/teacher')">教师登录</button>
        </div>

      </div>
    </div>

    <!-- 平台特色功能 -->
    <div class="features-section">
      <h2>平台特色功能</h2>
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">📚</div>
          <h4>智能课程管理</h4>
          <p>支持多媒体课程内容，智能推荐学习路径</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">✍️</div>
          <h4>作业管理系统</h4>
          <p>在线布置、提交、批改作业，实时反馈学习效果</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <h4>成绩统计分析</h4>
          <p>多维度成绩统计，可视化学习进度跟踪</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔒</div>
          <h4>安全可靠</h4>
          <p>数据加密传输，权限隔离，保障信息安全</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📱</div>
          <h4>多端协同</h4>
          <p>支持PC、平板、手机多设备访问</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <h4>高效响应</h4>
          <p>优化性能，支持高并发，响应时间小于2秒</p>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="footer">
      <p>© 2024 大学生智慧学习平台. 保留所有权利</p>
    </div>
  </div>
</template>

<style scoped>
/* Global Styles */
.home-container {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* Navbar */
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1890ff;
}

.nav-links a {
  margin-left: 30px;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-links a:hover {
  color: #1890ff;
}

/* Banner */
.banner {
  background: linear-gradient(135deg, #1890ff 0%, #2fc2f6 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
}

.banner-content {
  max-width: 800px;
  margin: 0 auto;
}

.banner h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  font-weight: 700;
}

.banner p {
  font-size: 1.1rem;
  margin-bottom: 30px;
  opacity: 0.95;
}

.start-btn {
  background-color: white;
  color: #1890ff;
  border: none;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* Identity Section */
.identity-section {
  padding: 60px 20px;
  background-color: white;
  text-align: center;
}

.identity-section h2 {
  font-size: 2rem;
  margin-bottom: 40px;
  color: #333;
  font-weight: 600;
}

.identity-cards {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-5px);
}

.card-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.card h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

.card p {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 25px;
  line-height: 1.7;
}

.card-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-btn:hover {
  background-color: #40a9ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* Features Section */
.features-section {
  padding: 60px 20px;
  background-color: #fafafa;
  text-align: center;
}

.features-section h2 {
  font-size: 2rem;
  margin-bottom: 40px;
  color: #333;
  font-weight: 600;
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
}

.feature-item {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 30px 20px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-3px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #1890ff;
}

.feature-item h4 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #333;
  font-weight: 600;
}

.feature-item p {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
}

/* Footer */
.footer {
  background-color: #001529;
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.footer p {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
  /* Navbar */
  .nav-content {
    flex-direction: column;
    height: auto;
    padding: 20px;
    gap: 15px;
  }
  
  .nav-links a {
    margin: 0 15px;
  }
  
  /* Banner */
  .banner h1 {
    font-size: 2rem;
  }
  
  .banner p {
    font-size: 1rem;
  }
  
  /* Identity Section */
  .identity-section h2 {
    font-size: 1.8rem;
  }
  
  .identity-cards {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  
  /* Features Section */
  .features-section h2 {
    font-size: 1.8rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}

@media (max-width: 480px) {
  /* Banner */
  .banner {
    padding: 60px 15px;
  }
  
  .banner h1 {
    font-size: 1.8rem;
  }
  
  /* Identity Section */
  .identity-section h2 {
    font-size: 1.6rem;
  }
  
  .card {
    padding: 25px 20px;
  }
  
  /* Features Section */
  .features-section h2 {
    font-size: 1.6rem;
  }
}
</style>