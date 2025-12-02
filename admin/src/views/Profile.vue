<script setup>
import { ref, reactive, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import { authAPI, userPreferencesAPI } from '../services/api'

// 加载状态
const loading = ref(false)
const saving = ref(false)

// 用户基本信息（从后端获取，只读）
const userInfo = reactive({
  id: null,
  username: '',
  email: '',
  role: '',
  status: '',
  createdAt: null,
  updatedAt: null
})

// 用户偏好设置
const preferences = reactive({
  language: 'zh-CN',
  emailNotifications: true,
  smsNotifications: false,
  aiAssistantEnabled: false
})

// 消息提示
const message = ref('')
const messageType = ref('success') // success, error

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码修改加载状态
const changingPassword = ref(false)

// 表单验证错误
const passwordErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 重置表单错误
const resetPasswordErrors = () => {
  passwordErrors.currentPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''
}

// 表单验证
const validatePasswordForm = () => {
  resetPasswordErrors()
  let isValid = true

  // 验证当前密码
  if (!passwordForm.currentPassword) {
    passwordErrors.currentPassword = '请输入当前密码'
    isValid = false
  }

  // 验证新密码
  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = '请输入新密码'
    isValid = false
  } else if (passwordForm.newPassword.length < 8) {
    passwordErrors.newPassword = '新密码长度至少为8个字符'
    isValid = false
  } else if (!/[a-zA-Z]/.test(passwordForm.newPassword) || !/[0-9]/.test(passwordForm.newPassword)) {
    passwordErrors.newPassword = '新密码必须包含字母和数字'
    isValid = false
  }

  // 验证确认密码
  if (!passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = '请确认新密码'
    isValid = false
  } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

// 修改密码
const changePassword = async () => {
  // 验证表单
  if (!validatePasswordForm()) {
    return
  }

  changingPassword.value = true
  try {
    // 构建请求数据
    const requestData = {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    }

    // 调用API
    const response = await authAPI.changePassword(requestData)
    
    // 成功处理
    showMessage('密码修改成功', 'success')
    
    // 重置表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    resetPasswordErrors()
    
  } catch (err) {
    console.error('修改密码失败:', err)
    
    // 错误处理
    if (err.response && err.response.data) {
      const errorData = err.response.data
      
      // 根据后端返回的错误信息设置对应的错误提示
      if (errorData.currentPassword) {
        passwordErrors.currentPassword = errorData.currentPassword
      }
      if (errorData.newPassword) {
        passwordErrors.newPassword = errorData.newPassword
      }
      if (errorData.confirmPassword) {
        passwordErrors.confirmPassword = errorData.confirmPassword
      }
      
      // 如果有全局错误消息，显示出来
      if (errorData.message) {
        showMessage(errorData.message, 'error')
      }
    }
    
    // 如果没有具体的字段错误，显示通用错误消息
    if (!Object.values(passwordErrors).some(error => error)) {
      showMessage('修改密码失败，请稍后重试', 'error')
    }
  } finally {
    changingPassword.value = false
  }
}

// 格式化日期时间
const formatDateTime = (instant) => {
  if (!instant) return '--'
  const date = new Date(instant)
  if (isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN')
}

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    'STUDENT': '学生',
    'TEACHER': '教师',
    'ADMIN': '管理员'
  }
  return roleMap[role] || role || '未知'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'ACTIVE': '已激活',
    'LOCKED': '已锁定',
    'DISABLED': '已禁用'
  }
  return statusMap[status] || status || '未知'
}

// 加载用户信息
const loadUserInfo = async () => {
  loading.value = true
  try {
    const response = await authAPI.getProfile()
    const data = response.data || response
    
    userInfo.id = data.id
    userInfo.username = data.username || ''
    userInfo.email = data.email || ''
    userInfo.role = data.role || ''
    userInfo.status = data.status || ''
    userInfo.createdAt = data.createdAt
    userInfo.updatedAt = data.updatedAt
  } catch (err) {
    console.error('加载用户信息失败:', err)
    showMessage('加载用户信息失败: ' + (err.message || '未知错误'), 'error')
  } finally {
    loading.value = false
  }
}

// 加载用户偏好设置
const loadPreferences = async () => {
  try {
    const response = await userPreferencesAPI.getPreferences()
    const data = response.data || response
    
    preferences.language = data.language || 'zh-CN'
    preferences.emailNotifications = data.emailNotifications !== undefined ? data.emailNotifications : true
    preferences.smsNotifications = data.smsNotifications !== undefined ? data.smsNotifications : false
    preferences.aiAssistantEnabled = data.aiAssistantEnabled !== undefined ? data.aiAssistantEnabled : false
  } catch (err) {
    console.error('加载用户偏好设置失败:', err)
    // 偏好设置加载失败不影响主流程，只记录错误
  }
}

// 保存用户偏好设置
const savePreferences = async () => {
  saving.value = true
  try {
    const requestData = {
      language: preferences.language,
      emailNotifications: preferences.emailNotifications,
      smsNotifications: preferences.smsNotifications,
      aiAssistantEnabled: preferences.aiAssistantEnabled
    }
    
    console.log('保存用户偏好设置:', requestData)
    const response = await userPreferencesAPI.updatePreferences(requestData)
    console.log('保存成功:', response)
    
    showMessage('偏好设置已更新', 'success')
  } catch (err) {
    console.error('保存用户偏好设置失败:', err)
    const errorMsg = err?.message || err?.error || '保存失败，请稍后重试'
    showMessage('保存失败: ' + errorMsg, 'error')
  } finally {
    saving.value = false
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await Promise.all([
    loadUserInfo(),
    loadPreferences()
  ])
})
</script>

<template>
  <MainLayout>
    <div class="profile-page">
      <!-- 消息提示 -->
      <div v-if="message" :class="['message-toast', messageType]">{{ message }}</div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载用户信息...</p>
      </div>

      <!-- 内容 -->
      <div v-else>
        <section class="card">
          <!-- 用户信息头部 -->
          <div class="profile-header">
            <div class="avatar">{{ userInfo.username ? userInfo.username.charAt(0).toUpperCase() : 'U' }}</div>
            <div>
              <div class="user-name">{{ userInfo.username || '未知用户' }}</div>
              <div class="user-info">
                {{ userInfo.email || '--' }} • 
                {{ getRoleText(userInfo.role) }} • 
                {{ getStatusText(userInfo.status) }}
              </div>
              <div class="user-meta">
                创建时间：{{ formatDateTime(userInfo.createdAt) }} • 
                更新时间：{{ formatDateTime(userInfo.updatedAt) }}
              </div>
            </div>
          </div>
        </section>
        
        <!-- 两列布局 -->
        <div class="grid-2">
          <!-- 基本信息卡片（只读） -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">基本信息</div>
            </div>
            <div class="form-row">
              <label class="form-label">用户ID</label>
              <input 
                :value="userInfo.id || '--'"
                class="form-input" 
                type="text"
                readonly
              >
            </div>
            <div class="form-row">
              <label class="form-label">用户名</label>
              <input 
                :value="userInfo.username || '--'"
                class="form-input" 
                type="text"
                readonly
              >
            </div>
            <div class="form-row">
              <label class="form-label">邮箱</label>
              <input 
                :value="userInfo.email || '--'"
                class="form-input" 
                type="email"
                readonly
              >
            </div>
            <div class="form-row">
              <label class="form-label">角色</label>
              <input 
                :value="getRoleText(userInfo.role)"
                class="form-input" 
                type="text"
                readonly
              >
            </div>
            <div class="form-row">
              <label class="form-label">状态</label>
              <input 
                :value="getStatusText(userInfo.status)"
                class="form-input" 
                type="text"
                readonly
              >
            </div>
            <div class="form-hint">
              <p>注意：后端暂未提供更新用户基本信息的接口。如需修改，请联系管理员。</p>
            </div>
          </div>

          <!-- 用户偏好设置卡片 -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">偏好设置</div>
            </div>
            <div class="form-row">
              <label class="form-label">语言</label>
              <select class="form-input form-select" v-model="preferences.language">
                <option value="zh-CN">中文（简体）</option>
                <option value="zh-TW">中文（繁体）</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div class="form-row">
              <label class="form-label">邮件通知</label>
              <div class="switch">
                <input 
                  type="checkbox" 
                  v-model="preferences.emailNotifications"
                >
                <span class="desc">接收邮件通知</span>
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">短信通知</label>
              <div class="switch">
                <input 
                  type="checkbox" 
                  v-model="preferences.smsNotifications"
                >
                <span class="desc">接收短信通知</span>
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">AI助手</label>
              <div class="switch">
                <input 
                  type="checkbox" 
                  v-model="preferences.aiAssistantEnabled"
                >
                <span class="desc">启用AI助手功能</span>
              </div>
            </div>
            <div class="actions">
              <button class="btn btn-primary" @click="savePreferences" :disabled="saving">
                {{ saving ? '保存中...' : '保存偏好设置' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 密码修改表单 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">密码管理</div>
          </div>
          <div class="form-row">
            <label class="form-label">当前密码</label>
            <input 
              v-model="passwordForm.currentPassword"
              class="form-input"
              type="password"
              placeholder="请输入当前密码"
            >
            <div v-if="passwordErrors.currentPassword" class="error-message">{{ passwordErrors.currentPassword }}</div>
          </div>
          <div class="form-row">
            <label class="form-label">新密码</label>
            <input 
              v-model="passwordForm.newPassword"
              class="form-input"
              type="password"
              placeholder="请输入新密码"
            >
            <div v-if="passwordErrors.newPassword" class="error-message">{{ passwordErrors.newPassword }}</div>
          </div>
          <div class="form-row">
            <label class="form-label">确认新密码</label>
            <input 
              v-model="passwordForm.confirmPassword"
              class="form-input"
              type="password"
              placeholder="请再次输入新密码"
            >
            <div v-if="passwordErrors.confirmPassword" class="error-message">{{ passwordErrors.confirmPassword }}</div>
          </div>
          <div class="form-hint">
            <p>密码要求：长度至少8个字符，包含字母和数字。</p>
          </div>
          <div class="actions">
            <button class="btn btn-primary" @click="changePassword" :disabled="changingPassword">
              {{ changingPassword ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.profile-page {
  width: 100%;
}

/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  color: white;
  font-size: 14px;
}

.message-toast.success {
  background-color: #34c759;
}

.message-toast.error {
  background-color: #ff3b30;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 卡片样式 */
.card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 16px;
  border: 1px solid #d1d1d6;
}

/* 用户信息头部 */
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #ff3b30;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
}

.user-name {
  font-weight: 600;
  font-size: 18px;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.user-info {
  color: #86868b;
  font-size: 14px;
  margin-bottom: 4px;
}

.user-meta {
  color: #86868b;
  font-size: 12px;
  margin-top: 8px;
}

/* 网格布局 */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d1d1d6;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

/* 表单行 */
.form-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.form-label {
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

.form-input[readonly] {
  background-color: #f2f2f7;
  cursor: not-allowed;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.switch input {
  width: 42px;
  height: 24px;
  cursor: pointer;
}

.desc {
  color: #86868b;
  font-size: 14px;
}

.form-hint {
  margin-top: 16px;
  padding: 12px;
  background-color: #f2f2f7;
  border-radius: 8px;
  font-size: 13px;
  color: #636366;
}

.form-hint p {
  margin: 0;
  line-height: 1.5;
}

.error-message {
  grid-column: 2;
  color: #ff3b30;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 8px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #86868b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 按钮组 */
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
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

.btn-secondary {
  background-color: #ffffff;
  color: #1d1d1f;
  border: 1px solid #d1d1d6;
}

.btn-secondary:hover {
  background-color: #f2f2f7;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .form-label {
    margin-bottom: 4px;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>