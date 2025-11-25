<script setup lang="ts">
import { ref } from 'vue'
import router from '../router'
import axios from 'axios'

// Form data
const isLoginMode = ref(true)
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

// API configuration
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// Toggle between login and register modes
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  error.value = ''
}

// Handle form submission
const handleSubmit = async () => {
  error.value = ''
  
  // Validation
  if (isLoginMode.value) {
    if (!username.value || !password.value) {
      error.value = '请填写完整的登录信息'
      return
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: username.value,
        password: password.value
      })
      
      // Save token
      localStorage.setItem('token', response.data.accessToken)
      localStorage.setItem('tokenType', response.data.tokenType)
      localStorage.setItem('expiresIn', response.data.expiresIn.toString())
      
      // Redirect to teacher page
      router.push('/teacher/dashboard')
    } catch (err: any) {
      error.value = err.response?.data?.message || '登录失败，请检查用户名和密码'
    }
  } else {
    if (!username.value || !email.value || !password.value || !confirmPassword.value) {
      error.value = '请填写完整的注册信息'
      return
    }
    
    if (password.value !== confirmPassword.value) {
      error.value = '两次输入的密码不一致'
      return
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: username.value,
        email: email.value,
        password: password.value,
        role: 'TEACHER' // For teacher registration, role is required and should be 'TEACHER'
      })
      
      // Save token
      localStorage.setItem('token', response.data.accessToken)
      localStorage.setItem('tokenType', response.data.tokenType)
      localStorage.setItem('expiresIn', response.data.expiresIn.toString())
      
      // Redirect to teacher page
      router.push('/teacher/dashboard')
    } catch (err: any) {
      error.value = err.response?.data?.message || '注册失败，请检查信息是否正确'
    }
  }
}
</script>

<template>
  <div class="teacher-login-container">
    <div class="background-image">
      <!-- 可以在这里添加背景图片 -->
    </div>
    <div class="login-card">
      <div class="logo">
        <img src="/assets/teacher-logo.svg" alt="教师Logo">
      </div>
      <div class="title">
        <h2>{{ isLoginMode ? '教师登录' : '教师注册' }}</h2>
      </div>
      
      <div class="form-container">
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <!-- Username field -->
        <div class="input-group">
          <label for="username">用户名</label>
          <input 
            id="username"
            type="text"
            placeholder="请输入用户名"
            v-model="username"
            required
          >
        </div>
        
        <!-- Email field (only in register mode) -->
        <div v-if="!isLoginMode" class="input-group">
          <label for="email">邮箱</label>
          <input 
            id="email"
            type="email"
            placeholder="请输入邮箱"
            v-model="email"
            required
          >
        </div>
        
        <!-- Password field -->
        <div class="input-group">
          <label for="password">密码</label>
          <input 
            id="password"
            type="password"
            placeholder="请输入密码"
            v-model="password"
            required
          >
        </div>
        
        <!-- Confirm password field (only in register mode) -->
        <div v-if="!isLoginMode" class="input-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            id="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            v-model="confirmPassword"
            required
          >
        </div>
        
        <!-- Submit button -->
        <div class="button-group">
          <button class="submit-btn" @click="handleSubmit">
            {{ isLoginMode ? '登录' : '注册' }}
          </button>
        </div>
        
        <!-- Toggle mode link -->
        <div class="toggle-link">
          <span v-if="isLoginMode">还没有账号？</span>
          <span v-else>已经有账号？</span>
          <button class="link-btn" @click="toggleMode">
            {{ isLoginMode ? '立即注册' : '立即登录' }}
          </button>
        </div>
        
        <!-- Back to home button -->
        <div class="back-button">
          <button class="back-btn" @click="router.push('/')">
            返回首页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.1;
  background: url('/assets/teacher-background.svg') center center no-repeat;
  background-size: cover;
}

.login-card {
  position: relative;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 400px;
  max-width: 90%;
  z-index: 1;
}

.logo img {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  display: block;
}

.title h2 {
  text-align: center;
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 30px;
}

.form-container {
  width: 100%;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  color: #555;
  font-weight: 500;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #f5576c;
  box-shadow: 0 0 0 2px rgba(245, 87, 108, 0.2);
}

.error-message {
  background-color: #fff3f3;
  border: 1px solid #f87171;
  color: #dc2626;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 0.9rem;
}

.button-group {
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 87, 108, 0.4);
}

.toggle-link {
  text-align: center;
  margin-bottom: 20px;
  color: #666;
  font-size: 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  color: #f5576c;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 5px;
}

.link-btn:hover {
  text-decoration: underline;
}

.back-button {
  text-align: center;
}

.back-btn {
  background: none;
  border: 1px solid #ddd;
  color: #666;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #f9fafb;
  border-color: #ccc;
}

@media (max-width: 768px) {
  .login-card {
    padding: 20px;
  }
  
  .title h2 {
    font-size: 1.5rem;
  }
}
</style>