<script setup>
import { ref, reactive } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'

// 基本设置
const basicSettings = reactive({
  platformName: '智慧学习平台',
  defaultSemester: '春季学期',
  announcement: ''
})

// 安全设置
const securitySettings = reactive({
  strongPassword: true,
  twoFactorAuth: false,
  sessionTimeout: '30分钟'
})

// 通知设置
const notificationSettings = reactive({
  systemNotification: true,
  courseReview: true,
  alertNotification: true
})

// 外观设置
const appearanceSettings = reactive({
  themeColor: '默认（蓝）',
  borderRadius: '默认'
})

// 保存基本设置
const saveBasicSettings = () => {
  // 在实际应用中，这里会调用API保存设置
  console.log('保存基本设置', basicSettings)
  showMessage('设置保存成功')
}

// 重置基本设置
const resetBasicSettings = () => {
  basicSettings.platformName = '智慧学习平台'
  basicSettings.defaultSemester = '春季学期'
  basicSettings.announcement = ''
  showMessage('设置已重置')
}

// 消息提示
const message = ref('')
const showMessage = (text) => {
  message.value = text
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<template>
  <MainLayout>
    <main class="main-content">
      <!-- 基本设置 -->
      <section class="card">
        <h2 class="section-title">基本设置</h2>
        <div class="form-row">
          <label class="form-label">平台名称</label>
          <input 
            class="form-input" 
            v-model="basicSettings.platformName"
            type="text"
          >
        </div>
        <div class="form-row">
          <label class="form-label">默认学期</label>
          <select class="form-input form-select" v-model="basicSettings.defaultSemester">
            <option>春季学期</option>
            <option>秋季学期</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">公告</label>
          <textarea 
            class="form-input form-textarea" 
            v-model="basicSettings.announcement"
            placeholder="输入平台公告..."
          ></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="resetBasicSettings">重置</button>
          <button class="btn btn-primary" @click="saveBasicSettings">保存</button>
        </div>
      </section>

      <!-- 设置网格 -->
      <section class="settings-grid">
        <!-- 安全设置 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">安全设置</div>
          </div>
          <div class="form-row">
            <label class="form-label">强密码策略</label>
            <div class="switch">
              <input 
                type="checkbox" 
                v-model="securitySettings.strongPassword"
              >
              <span class="desc">要求包含数字与特殊字符</span>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">两步验证</label>
            <div class="switch">
              <input 
                type="checkbox" 
                v-model="securitySettings.twoFactorAuth"
              >
              <span class="desc">登录时短信验证码</span>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">会话超时</label>
            <select class="form-input form-select" v-model="securitySettings.sessionTimeout">
              <option>30分钟</option>
              <option>1小时</option>
              <option>2小时</option>
            </select>
          </div>
        </div>

        <!-- 通知设置 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">通知设置</div>
          </div>
          <div class="form-row">
            <label class="form-label">系统通知</label>
            <div class="switch">
              <input 
                type="checkbox" 
                v-model="notificationSettings.systemNotification"
              >
              <span class="desc">接收系统更新通知</span>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">课程审核</label>
            <div class="switch">
              <input 
                type="checkbox" 
                v-model="notificationSettings.courseReview"
              >
              <span class="desc">有新课程提交时提醒</span>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">异常告警</label>
            <div class="switch">
              <input 
                type="checkbox" 
                v-model="notificationSettings.alertNotification"
              >
              <span class="desc">服务异常自动通知</span>
            </div>
          </div>
        </div>

        <!-- 外观设置 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">外观设置</div>
          </div>
          <div class="form-row">
            <label class="form-label">主题色</label>
            <select class="form-input form-select" v-model="appearanceSettings.themeColor">
              <option>默认（蓝）</option>
              <option>紫色</option>
              <option>绿色</option>
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">圆角大小</label>
            <select class="form-input form-select" v-model="appearanceSettings.borderRadius">
              <option>默认</option>
              <option>较小</option>
              <option>较大</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 消息提示 -->
      <div v-if="message" class="message-toast">{{ message }}</div>
    </main>
  </MainLayout>
</template>

<style scoped>
.main-content {
  padding: 24px;
  min-height: 100vh;
}

/* 卡片样式 - 与 HTML 版本一致 */
.card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 16px;
  border: 1px solid #d1d1d6;
}

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

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 0;
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

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
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

/* 按钮样式 - 与 HTML 版本一致 */
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

/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #34c759;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .form-label {
    margin-bottom: 4px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>

