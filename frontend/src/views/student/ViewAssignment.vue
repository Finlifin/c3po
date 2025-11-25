<template>
  <div class="view-assignment">
    <!-- 左侧菜单栏 -->
    <StudentSidebar activeMenu="courses" @logout="logout" />
    
    <div class="main-content">
      <div class="content">
        <!-- 页面标题 -->
        <div class="page-header">
          <div class="header-actions">
            <button class="back-btn" @click="goBack">
              ← 返回作业列表
            </button>
          </div>
          <h1 v-if="assignment">作业详情：{{ assignment.title }}</h1>
          <h1 v-else>作业详情</h1>
        </div>
        
        <!-- 加载状态和错误提示 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载作业信息...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <p class="error-message">{{ error }}</p>
          <button class="retry-btn" @click="fetchAssignmentAndSubmissionDetails">重新加载</button>
        </div>
        
        <!-- 作业详情和提交记录区域 -->
        <div v-else-if="assignment && submission" class="assignment-details">
          <!-- 作业信息卡片 -->
          <div class="assignment-info-card">
            <div class="info-header">
              <h2>{{ assignment.title }}</h2>
              <span class="assignment-type-badge">作业</span>
            </div>
            
            <div class="info-body">
              <div class="info-meta">
                <div class="meta-item">
                  <span class="meta-icon">⏰</span>
                  <span class="meta-label">截止时间:</span>
                  <span class="meta-value">{{ formatDate(assignment.deadline) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-icon">🔄</span>
                  <span class="meta-label">允许重提交:</span>
                  <span class="meta-value">{{ assignment.allowResubmit ? '是' : '否' }}</span>
                </div>
                <div class="meta-item" v-if="assignment.allowResubmit">
                  <span class="meta-icon">📊</span>
                  <span class="meta-label">最大重提交次数:</span>
                  <span class="meta-value">{{ assignment.maxResubmit }}</span>
                </div>
              
                <div class="meta-item">
                  <span class="meta-icon">📅</span>
                  <span class="meta-label">提交时间:</span>
                  <span class="meta-value">{{ formatDate(submission.submittedAt) }}</span>
                </div>
                <div class="meta-item" v-if="submission.resubmitCount > 0">
                  <span class="meta-icon">🔄</span>
                  <span class="meta-label">已重提交次数:</span>
                  <span class="meta-value">{{ submission.resubmitCount }}/{{ assignment.maxResubmit }}</span>
                </div>
              </div>
              
              <div class="grading-rubric">
                <h3>评分标准:</h3>
                <div class="rubric-items">
                  <div 
                    v-for="(criterion, index) in assignment.gradingRubric" 
                    :key="index"
                    class="rubric-item"
                  >
                    <span class="criterion-name">{{ criterion.criterion }}</span>
                    <span class="criterion-weight">({{ (criterion.weight * 100).toFixed(0) }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 提交内容区域 -->
          <div class="submission-content-section">
            <h2>提交内容</h2>
            
            <!-- 文件附件列表 -->
            <div class="attachments-section" v-if="fileAttachments.length > 0">
              <h3>附件文件</h3>
              <div class="attachments-list">
                <div 
                  v-for="(file, index) in fileAttachments" 
                  :key="index"
                  class="attachment-item"
                >
                  <a :href="file" target="_blank" class="attachment-link">{{ getFileNameFromUrl(file) }}</a>
                  <button 
                    class="remove-file-btn" 
                    @click="removeFile(index)"
                    :disabled="isResubmitting"
                  >×</button>
                </div>
              </div>
            </div>
            
            <!-- 文本输入区域 -->
            <div class="text-input-section" v-if="canResubmit">
              <h3>作业说明</h3>
              <textarea 
                v-model="assignmentText" 
                class="text-input" 
                placeholder="请输入作业说明或相关内容..."
                rows="6"
                :disabled="isResubmitting"
              ></textarea>
            </div>
            
            <!-- 固定文本内容 -->
            <div class="fixed-text-section" v-else-if="assignmentText">
              <h3>提交说明</h3>
              <div class="fixed-text">
                {{ assignmentText }}
              </div>
            </div>
            
            <!-- 重新提交区域 -->
            <div class="resubmit-section" v-if="canResubmit">
              <h3>添加新文件</h3>
              <div class="upload-area">
                <input 
                  type="file" 
                  id="file-upload" 
                  class="file-input" 
                  @change="handleFileSelect"
                  multiple
                  :disabled="isResubmitting"
                />
                <label for="file-upload" class="upload-label">
                  <div class="upload-icon">📁</div>
                  <p>点击或拖拽文件到此处上传</p>
                  <p class="upload-hint">支持多种文件格式</p>
                </label>
              </div>
              
              <!-- 新上传文件列表 -->
              <div class="uploaded-files" v-if="newUploadedFiles.length > 0">
                <h4>新添加文件:</h4>
                <div 
                  v-for="(file, index) in newUploadedFiles" 
                  :key="index"
                  class="file-item"
                >
                  <span class="file-name">{{ file.name }}</span>
                  <button 
                    class="remove-file-btn" 
                    @click="removeNewFile(index)"
                    :disabled="isResubmitting"
                  >×</button>
                </div>
              </div>
              
              <!-- 重新提交按钮 -->
              <div class="resubmit-actions">
                <button 
                  class="resubmit-btn" 
                  @click="resubmitAssignment"
                  :disabled="isResubmitting"
                >
                  {{ isResubmitting ? '提交中...' : '重新提交作业' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import StudentSidebar from '../../components/StudentSidebar.vue'

const route = useRoute()
const router = useRouter()

// 从路由参数中获取assignmentId和submissionId
const assignmentId = computed(() => route.params.assignmentId as string)
const submissionId = computed(() => route.query.submissionId as string)

// 作业类型定义
interface Assignment {
  id: string
  courseId: string
  title: string
  type: 'ASSIGNMENT' | 'QUIZ'
  deadline: string
  allowResubmit: boolean
  maxResubmit: number
  gradingRubric: {
    criterion: string
    weight: number
  }[]
  visibilityTags: string[]
  releaseAt: string
  published: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

// 提交记录类型定义
interface Submission {
  id: string
  assignmentId: string
  studentId: string
  status: 'SUBMITTED' | 'GRADED' | 'REJECTED'
  score: number | null
  submittedAt: string
  attachments: string[]
  feedback: string | null
  rubricScores: any[]
  appealReason: string | null
  appealedAt: string | null
  gradingTeacherId: string | null
  resubmitCount: number
  createdAt: string
  updatedAt: string
}

// 状态变量
const assignment = ref<Assignment | null>(null)
const submission = ref<Submission | null>(null)
const loading = ref(false)
const error = ref('')
const isResubmitting = ref(false)
const assignmentText = ref('')
const fileAttachments = ref<string[]>([])
const newUploadedFiles = ref<File[]>([])
const newUploadedFileUrls = ref<string[]>([])

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'
const UPLOAD_API_BASE_URL = 'http://10.70.141.134:5000/api/v1'

// 获取token
const getToken = () => {
  return localStorage.getItem('token')
}

// 检查token有效性
const checkAuth = () => {
  const token = getToken()
  console.log('检查认证状态，token存在:', !!token)
  if (!token) {
    // 在开发环境下不自动跳转，便于调试
    if (import.meta.env.DEV) {
      console.log('开发环境：未找到token，但不跳转')
      return false
    }
    router.push('/student')
    return false
  }
  return true
}

// 处理退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/student')
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'SUBMITTED':
      return '已提交'
    case 'GRADED':
      return '已评分'
    case 'REJECTED':
      return '已退回'
    default:
      return '未知状态'
  }
}

// 判断是否可以重新提交
const canResubmit = computed(() => {
  if (!assignment.value || !submission.value) return false
  return assignment.value.allowResubmit && submission.value.resubmitCount < assignment.value.maxResubmit
})

// 从URL中提取文件名
const getFileNameFromUrl = (url: string) => {
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// 检查是否为文件URL
const isFileUrl = (text: string) => {
  return text.startsWith('http') && (text.includes('.pdf') || text.includes('.jpg') || text.includes('.png') || text.includes('.doc') || text.includes('.docx') || text.includes('.xls') || text.includes('.xlsx') || text.includes('.zip') || text.includes('.rar'))
}

// 处理附件，分离文件和文本
const processAttachments = (attachments: string[]) => {
  const files: string[] = []
  let textContent = ''
  
  attachments.forEach(attachment => {
    const trimmedAttachment = attachment.trim()
    if (isFileUrl(trimmedAttachment)) {
      files.push(trimmedAttachment)
    } else {
      textContent = trimmedAttachment
    }
  })
  
  fileAttachments.value = files
  assignmentText.value = textContent
}

// 获取作业详情
const fetchAssignmentDetails = async () => {
  if (!checkAuth() || !assignmentId.value) return
  
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId.value}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    assignment.value = response.data.data
  } catch (err: any) {
    console.error('Failed to fetch assignment details:', err)
    throw err
  }
}

// 获取提交详情
const fetchSubmissionDetails = async () => {
  if (!checkAuth() || !submissionId.value) return
  
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/submissions/${submissionId.value}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    submission.value = response.data.data
    // 处理附件
    if (submission.value.attachments) {
      processAttachments(submission.value.attachments)
    }
  } catch (err: any) {
    console.error('Failed to fetch submission details:', err)
    throw err
  }
}

// 同时获取作业和提交详情
const fetchAssignmentAndSubmissionDetails = async () => {
  if (!checkAuth()) return
  
  loading.value = true
  error.value = ''
  
  try {
    await Promise.all([fetchAssignmentDetails(), fetchSubmissionDetails()])
  } catch (err: any) {
    console.error('Failed to fetch details:', err)
    error.value = '获取信息失败'
  } finally {
    loading.value = false
  }
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newUploadedFiles.value = [...newUploadedFiles.value, ...Array.from(target.files)]
    // 清空input以允许重复选择相同文件
    target.value = ''
  }
}

// 移除现有文件
const removeFile = (index: number) => {
  fileAttachments.value.splice(index, 1)
}

// 移除新上传的文件
const removeNewFile = (index: number) => {
  newUploadedFiles.value.splice(index, 1)
  if (newUploadedFileUrls.value[index]) {
    newUploadedFileUrls.value.splice(index, 1)
  }
}

// 上传文件到服务器
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await axios.post(`${UPLOAD_API_BASE_URL}/images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (response.data.success) {
      // 返回完整的文件URL
      return `${UPLOAD_API_BASE_URL}/images/${response.data.url}`
    } else {
      throw new Error('文件上传失败')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    throw error
  }
}

// 重新提交作业
const resubmitAssignment = async () => {
  if (!submission.value) return
  
  isResubmitting.value = true
  
  try {
    // 上传所有新文件
    const uploadPromises = newUploadedFiles.value.map(file => uploadFile(file))
    const newFileUrls = await Promise.all(uploadPromises)
    
    // 准备提交数据（保留未删除的旧文件和所有新文件）
    const attachments: string[] = [...fileAttachments.value, ...newFileUrls]
    if (assignmentText.value.trim()) {
      attachments.push(assignmentText.value.trim())
    }
    
    // 提交作业
    const token = getToken()
    await axios.put(`${API_BASE_URL}/submissions/${submission.value.id}`, 
      { attachments },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    alert('作业重新提交成功！')
    // 重新加载提交详情
    await fetchSubmissionDetails()
    // 清空新文件列表
    newUploadedFiles.value = []
    newUploadedFileUrls.value = []
  } catch (err: any) {
    console.error('作业重新提交失败:', err)
    alert('作业重新提交失败，请重试')
  } finally {
    isResubmitting.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchAssignmentAndSubmissionDetails()
})
</script>

<style scoped>
.view-assignment {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  overflow: hidden;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  margin-left: 20px; /* 与侧边栏宽度一致 */
  display: flex;
  flex-direction: column;
  width: calc(100vw - 280px);
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content {
  padding: 30px;
  width: 80%;
  box-sizing: border-box;
}

/* 页面标题 */
.page-header {
  margin-bottom: 30px;
}

.header-actions {
  margin-bottom: 15px;
}

.back-btn {
  padding: 8px 16px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #5568d3;
  transform: translateY(-1px);
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
  font-weight: 700;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background-color: #ffebee;
  border-radius: 8px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.error-message {
  color: #d32f2f;
  font-size: 1.1rem;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 10px 24px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-1px);
}

/* 作业详情区域 */
.assignment-details {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 作业信息卡片 */
.assignment-info-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.info-header h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.assignment-type-badge {
  padding: 4px 12px;
  background-color: #667eea;
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 信息主体 */
.info-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.meta-icon {
  font-size: 1.2rem;
}

.meta-label {
  font-weight: 500;
}

.meta-value {
  font-weight: 400;
}

.submission-status {
  color: #4caf50;
  font-weight: 600;
}

/* 评分标准 */
.grading-rubric h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 12px;
}

.rubric-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.rubric-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #f8f9fa;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.criterion-name {
  color: #333;
  font-weight: 500;
}

.criterion-weight {
  color: #666;
}

/* 提交内容区域 */
.submission-content-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.submission-content-section h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 24px 0;
  font-weight: 600;
}

/* 附件区域 */
.attachments-section {
  margin-bottom: 24px;
}

.attachments-section h3 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f0f7ff;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.attachment-link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
}

.attachment-link:hover {
  text-decoration: underline;
}

/* 文件列表项 */
.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-name {
  color: #333;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
}

/* 移除文件按钮 */
.remove-file-btn {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.remove-file-btn:hover:not(:disabled) {
  background-color: #d32f2f;
  transform: scale(1.1);
}

.remove-file-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 文本输入区域 */
.text-input-section {
  margin-bottom: 24px;
}

.text-input-section h3 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.text-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.text-input:focus:not(:disabled) {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.text-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.text-input::placeholder {
  color: #999;
}

/* 固定文本显示区域 */
.fixed-text-section {
  margin-bottom: 24px;
}

.fixed-text-section h3 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.fixed-text {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  color: #333;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 重新提交区域 */
.resubmit-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.resubmit-section h3 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 500;
}

/* 上传区域 */
.upload-area {
  position: relative;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
  margin-bottom: 16px;
}

.upload-area:hover:not(:disabled) {
  border-color: #667eea;
  background-color: #f0f2ff;
}

.upload-area:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.upload-label p {
  margin: 0 0 4px 0;
  color: #666;
}

.upload-hint {
  font-size: 0.9rem;
  color: #999;
}

/* 已上传文件列表 */
.uploaded-files {
  margin-top: 16px;
  margin-bottom: 24px;
}

.uploaded-files h4 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 12px 0;
  font-weight: 500;
}

/* 重新提交按钮 */
.resubmit-actions {
  display: flex;
  justify-content: flex-end;
}

.resubmit-btn {
  padding: 10px 24px;
  background-color: #f57c00;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.resubmit-btn:hover:not(:disabled) {
  background-color: #ef6c00;
  transform: translateY(-1px);
}

.resubmit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 0;
    width: 100vw;
  }
  
  .info-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 20px;
  }
  
  .info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .upload-area {
    padding: 30px 20px;
  }
  
  .resubmit-actions {
    justify-content: center;
  }
  
  .resubmit-btn {
    width: 100%;
    text-align: center;
  }
}
</style>