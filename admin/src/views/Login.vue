<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api.js'
import { mockAPI } from '../services/mockData.js'

const router = useRouter()
const username = ref('')
const password = ref('')
const verificationCode = ref('')
const errorMessage = ref('')
const loading = ref(false)
const useMock = false // 使用真实后端API

// 生成随机验证码
const generateVerificationCode = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const currentCode = ref(generateVerificationCode())

const refreshCode = () => {
  currentCode.value = generateVerificationCode()
}



const handleLogin = async () => {
  // 简单的表单验证
  if (!username.value.trim() || !password.value.trim() || !verificationCode.value.trim()) {
    errorMessage.value = '请填写所有必填字段'
    return
  }

  // 验证验证码
  if (verificationCode.value.toLowerCase() !== currentCode.value.toLowerCase()) {
    errorMessage.value = '验证码错误'
    refreshCode()
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    let response
    if (useMock) {
      // 使用 mock API
      response = await mockAPI.login({ username: username.value, password: password.value })
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    } else {
      // 使用真实后端API
      // 后端期望的字段名是 identifier，不是 username
      const credentials = { identifier: username.value, password: password.value }
      response = await authAPI.login(credentials)
      
      // 后端返回的字段是 accessToken，不是 token
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken)
        
        // 获取用户信息
        try {
          const userResponse = await authAPI.getProfile()
          localStorage.setItem('user', JSON.stringify(userResponse))
        } catch (profileError) {
          // 如果获取用户信息失败，至少保存基本信息
          console.warn('获取用户信息失败:', profileError)
          localStorage.setItem('user', JSON.stringify({ username: username.value }))
        }
      } else {
        throw new Error('登录响应中缺少 accessToken')
      }
    }
    
    // 登录成功后跳转到仪表盘
    router.push('/admin/dashboard')
  } catch (error) {
    // 处理登录失败
    console.error('登录错误:', error)
    errorMessage.value = error.message || error.error || '登录失败，请稍后重试'
    refreshCode()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">管理员登录</h1>
        <p class="login-subtitle">系统管理后台</p>
      </div>
      
      <div class="security-notice">
        ⚠️ 此区域仅供系统管理员使用，请确保您有相应的访问权限。
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">管理员账号</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="username" 
            placeholder="请输入管理员账号"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            type="password" 
            class="form-input" 
            v-model="password" 
            placeholder="请输入密码"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">验证码</label>
          <div class="verification-input-wrapper">
            <input 
              type="text" 
              class="form-input verification-input" 
              v-model="verificationCode" 
              placeholder="请输入验证码"
              required
            />
            <div 
              class="verification-code-display" 
              @click="refreshCode"
              title="点击刷新"
            >
              {{ currentCode }}
            </div>
          </div>
        </div>
        
        <div class="forgot-password-wrapper">
          <a href="#" class="forgot-password" @click.prevent>忘记密码？</a>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button type="submit" class="btn btn-danger w-full" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登录</span>
        </button>
      </form>
      
      <div class="terms-notice">
        <span>登录即表示您同意我们的服务条款和隐私政策</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #ff3b30 0%, #ff9500 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}



.login-container {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  margin: 16px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.login-subtitle {
  color: #86868b;
  font-size: 16px;
}

.security-notice {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #ff3b30;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1d1d1f;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 12px;
  font-size: 16px;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-input::placeholder {
  color: #86868b;
}

.verification-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.verification-input {
  flex: 1;
}

.verification-code-display {
  width: 100px;
  height: 44px;
  background: #f2f2f7;
  border: 1px solid #d1d1d6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #86868b;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.verification-code-display:hover {
  background: #e5e5ea;
  border-color: #86868b;
}

.forgot-password-wrapper {
  text-align: right;
  margin-bottom: 24px;
}

.forgot-password {
  color: #007aff;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
}

.forgot-password:hover {
  color: #0056cc;
  text-decoration: underline;
}

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

.btn-danger {
  background-color: #ff3b30;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

.w-full {
  width: 100%;
}

.terms-notice {
  text-align: center;
  margin-top: 24px;
}

.terms-notice span {
  color: #c7c7cc;
  font-size: 14px;
}

.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 12px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #ffcdd2;
  font-weight: 500;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@media (max-width: 480px) {
  .login-container {
    padding: 24px 20px;
  }
  
  .back-link {
    top: 16px;
    left: 16px;
  }
  
  .login-title {
    font-size: 20px;
  }
  
  .verification-input-wrapper {
    flex-direction: column;
  }
  
  .verification-code-display {
    width: 100%;
  }
}
</style>