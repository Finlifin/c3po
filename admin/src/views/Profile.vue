<script setup>
import { ref, reactive, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'

// 用户基本信息
const userInfo = reactive({
  name: '系统管理员',
  email: 'admin@example.com',
  phone: '',
  lastLogin: '今天 10:12'
})

// 基本信息表单
const basicInfoForm = reactive({
  name: '系统管理员',
  email: 'admin@example.com',
  phone: ''
})

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
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

// 保存基本信息
const saveBasicInfo = () => {
  // 在实际应用中，这里应该调用API保存修改
  Object.assign(userInfo, { ...basicInfoForm })
  showMessage('个人信息已更新', 'success')
}

// 重置基本信息
const resetBasicInfo = () => {
  Object.assign(basicInfoForm, {
    name: userInfo.name,
    email: userInfo.email,
    phone: userInfo.phone
  })
}

// 更新密码
const updatePassword = () => {
  // 验证密码
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    showMessage('请填写所有密码字段', 'error')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showMessage('新密码和确认密码不一致', 'error')
    return
  }
  
  if (passwordForm.newPassword.length < 6) {
    showMessage('新密码长度至少为6位', 'error')
    return
  }
  
  // 在实际应用中，这里应该调用API更新密码
  // 清空表单
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  showMessage('密码已更新', 'success')
}

// 取消密码修改
const cancelPasswordUpdate = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 初始化数据
onMounted(() => {
  // 可以从localStorage或API获取用户信息
  const savedUserInfo = localStorage.getItem('userInfo')
  if (savedUserInfo) {
    const parsed = JSON.parse(savedUserInfo)
    Object.assign(userInfo, parsed)
    Object.assign(basicInfoForm, parsed)
  }
})
</script>

<template>
  <MainLayout>
    <div class="profile-page">
      <!-- 消息提示 -->
      <div v-if="message" :class="['message-toast', messageType]">{{ message }}</div>
      
      <section class="card">
      <!-- 用户信息头部 -->
      <div class="profile-header">
        <div class="avatar">{{ userInfo.name.charAt(0) }}</div>
        <div>
          <div class="user-name">{{ userInfo.name }}</div>
          <div class="user-info">{{ userInfo.email }} • 上次登录：{{ userInfo.lastLogin }}</div>
        </div>
      </div>
      
      <!-- 两列布局 -->
      <div class="grid-2">
        <!-- 基本信息卡片 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">基本信息</div>
          </div>
          <div class="form-row">
            <label class="form-label">姓名</label>
            <input 
              v-model="basicInfoForm.name" 
              class="form-input" 
              type="text"
            >
          </div>
          <div class="form-row">
            <label class="form-label">邮箱</label>
            <input 
              v-model="basicInfoForm.email" 
              class="form-input" 
              type="email"
            >
          </div>
          <div class="form-row">
            <label class="form-label">手机号</label>
            <input 
              v-model="basicInfoForm.phone" 
              class="form-input" 
              type="tel"
              placeholder="请输入手机号"
            >
          </div>
          <div class="actions">
            <button class="btn btn-secondary" @click="resetBasicInfo">重置</button>
            <button class="btn btn-primary" @click="saveBasicInfo">保存</button>
          </div>
        </div>

        <!-- 修改密码卡片 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">修改密码</div>
          </div>
          <div class="form-row">
            <label class="form-label">当前密码</label>
            <input 
              v-model="passwordForm.currentPassword" 
              class="form-input" 
              type="password"
              placeholder="当前密码"
            >
          </div>
          <div class="form-row">
            <label class="form-label">新密码</label>
            <input 
              v-model="passwordForm.newPassword" 
              class="form-input" 
              type="password"
              placeholder="新密码"
            >
          </div>
          <div class="form-row">
            <label class="form-label">确认新密码</label>
            <input 
              v-model="passwordForm.confirmPassword" 
              class="form-input" 
              type="password"
              placeholder="确认新密码"
            >
          </div>
          <div class="actions">
            <button class="btn btn-secondary" @click="cancelPasswordUpdate">取消</button>
            <button class="btn btn-primary" @click="updatePassword">更新密码</button>
          </div>
        </div>
      </div>
    </section>
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