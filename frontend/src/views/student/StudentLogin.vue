<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentAuthStore } from '../../stores/auth_student'
import { authApi } from '../../api/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useStudentAuthStore()

// Form data
const isLoginMode = ref(true)
const loading = ref(false)

const loginForm = reactive({
  username: 'student003',
  password: 'student003'
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Toggle between login and register modes
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  // Reset forms
  loginForm.username = ''
  loginForm.password = ''
  registerForm.username = ''
  registerForm.email = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
}

// Handle login
const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请填写完整的登录信息')
    return
  }

  loading.value = true
  try {
    await authStore.login({
      identifier: loginForm.username,
      password: loginForm.password
    })
    
    ElMessage.success('登录成功')
    router.push('/student/dashboard')
  } catch (err: any) {
    console.error('Login error:', err)
    ElMessage.error(err.response?.data?.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

// Handle register
const handleRegister = async () => {
  if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
    ElMessage.warning('请填写完整的注册信息')
    return
  }
  
  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const response = await authApi.register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
    })
    
    // Auto login after register
    authStore.setToken(response.data.accessToken)
    await authStore.fetchUserInfo()
    
    ElMessage.success('注册成功')
    router.push('/student/dashboard')
  } catch (err: any) {
    console.error('Register error:', err)
    ElMessage.error(err.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="student-login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-placeholder">
          <el-icon :size="50" color="#409eff"><User /></el-icon>
        </div>
        <h2>{{ isLoginMode ? '学生登录' : '学生注册' }}</h2>
        <p class="subtitle">C3PO 智慧学习平台</p>
      </div>

      <div class="form-wrapper">
        <!-- Login Form -->
        <el-form v-if="isLoginMode" :model="loginForm" @submit.prevent="handleLogin" label-position="top">
          <el-form-item label="用户名/邮箱">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名或邮箱" 
              :prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="密码">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码" 
              :prefix-icon="Lock"
              show-password
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button 
            type="primary" 
            class="submit-btn" 
            :loading="loading" 
            @click="handleLogin" 
            size="large"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form>

        <!-- Register Form -->
        <el-form v-else :model="registerForm" @submit.prevent="handleRegister" label-position="top">
          <el-form-item label="用户名">
            <el-input 
              v-model="registerForm.username" 
              placeholder="请输入用户名" 
              :prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input 
              v-model="registerForm.email" 
              type="email"
              placeholder="请输入邮箱" 
              :prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="密码">
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="请输入密码" 
              :prefix-icon="Lock"
              show-password
              size="large"
            />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入密码" 
              :prefix-icon="Lock"
              show-password
              size="large"
              @keyup.enter="handleRegister"
            />
          </el-form-item>
          <el-button 
            type="primary" 
            class="submit-btn" 
            :loading="loading" 
            @click="handleRegister" 
            size="large"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form>

        <div class="form-footer">
          <span v-if="isLoginMode">还没有账号？</span>
          <span v-else>已经有账号？</span>
          <el-button text @click="toggleMode" type="primary">
            {{ isLoginMode ? '立即注册' : '立即登录' }}
          </el-button>
        </div>

        <div class="back-home">
          <el-button text @click="router.push('/')">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.login-box {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 480px;
  padding: 50px 40px;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-placeholder {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 25px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.logo-placeholder :deep(.el-icon) {
  color: white !important;
}

.login-header h2 {
  color: #303133;
  font-size: 2rem;
  margin: 0 0 12px;
  font-weight: 700;
}

.subtitle {
  color: #909399;
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
}

.form-wrapper {
  width: 100%;
}

.form-wrapper :deep(.el-form-item) {
  margin-bottom: 24px;
}

.form-wrapper :deep(.el-form-item__label) {
  color: #606266;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.form-wrapper :deep(.el-input__wrapper) {
  padding: 12px 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.form-wrapper :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
}

.form-wrapper :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.form-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 0.95rem;
  color: #606266;
  padding-top: 25px;
  border-top: 1px solid #f0f0f0;
}

.form-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.form-footer a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.back-home {
  margin-top: 20px;
  text-align: center;
}

.back-home :deep(.el-button) {
  color: #909399;
  font-size: 0.9rem;
}

.back-home :deep(.el-button:hover) {
  color: #667eea;
}

@media (max-width: 768px) {
  .login-box {
    padding: 40px 30px;
    max-width: 95%;
  }

  .login-header h2 {
    font-size: 1.6rem;
  }

  .logo-placeholder {
    width: 80px;
    height: 80px;
  }
}
</style>