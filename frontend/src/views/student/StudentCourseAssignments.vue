<template>
  <div class="student-course-assignments">
    <!-- 左侧菜单栏 -->
    <StudentSidebar activeMenu="courses" @logout="logout" />
    
    <div class="main-content">
      <div class="content">
        <!-- 页面标题 -->
        <div class="page-header">
          <div class="header-actions">
            <button class="back-btn" @click="goBack">
              ← 返回课程列表
            </button>
          </div>
          <h1 v-if="courseInfo">
            {{ courseInfo.name }} - 课程作业与测试
          </h1>
          <h1 v-else>
            课程作业与测试
          </h1>
        </div>
        
        <!-- 加载状态和错误提示 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载作业和测试信息...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <p class="error-message">{{ error }}</p>
          <button class="retry-btn" @click="fetchAssignments">重新加载</button>
        </div>
        
        <!-- 作业和测试列表 -->
        <div v-else-if="assignments.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>暂无作业或测试</h3>
          <p>该课程目前还没有布置任何作业或测试。</p>
        </div>
        
        <div v-else>
          <!-- 筛选器 -->
          <div class="filter-container">
            <select v-model="filterType" class="filter-select">
              <option value="all">全部类型</option>
              <option value="ASSIGNMENT">作业</option>
              <option value="QUIZ">测试</option>
            </select>
            <select v-model="filterStatus" class="filter-select">
              <option value="all">全部状态</option>
              <option value="pending">待完成</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          
          <!-- 作业和测试列表 -->
          <div class="assignments-container">
            <div 
                v-for="assignment in filteredAssignments" 
                :key="assignment.id"
                class="assignment-card"
                :class="['assignment-type-' + assignment.type.toLowerCase()]"
            >
              <div class="assignment-header">
                <h3 class="assignment-title">{{ assignment.title }}</h3>
                <span class="assignment-type-badge">{{ getTypeName(assignment.type) }}</span>
              </div>
              
              <div class="assignment-body">
                <div class="assignment-meta">
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
                </div>
                
                <div class="assignment-rubric">
                  <h4>评分标准:</h4>
                  <div class="rubric-items">
                    <div 
                      v-for="(criterion, index) in assignment.gradingRubric" 
                      :key="index"
                      class="rubric-item"
                    >
                      <span class="criterion-name">{{ criterion.criterion }}</span>
                      <span class="criterion-weight">({{ (criterion.weight * 100).toFixed(0) }}%)</span>
                      <!-- 显示评分分数 -->
                      <span v-if="getSubmissionByAssignmentId(assignment.id)?.status === 'GRADED' && getRubricScore(assignment.id, criterion.criterion) !== null" class="criterion-score">
                        得分: {{ getRubricScore(assignment.id, criterion.criterion) }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- 提交信息显示 -->
                <div v-if="getSubmissionByAssignmentId(assignment.id)" class="submission-info">
                  <div class="submission-meta">
                    <div class="meta-item">
                      <span class="meta-icon">📅</span>
                      <span class="meta-label">提交时间:</span>
                      <span class="meta-value">{{ formatDate(getSubmissionByAssignmentId(assignment.id)?.submittedAt || '') }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-icon">📎</span>
                      <span class="meta-label">附件数:</span>
                      <span class="meta-value">{{ getSubmissionByAssignmentId(assignment.id)?.attachments.length || 0 }}</span>
                    </div>
                    <div class="meta-item" v-if="getSubmissionByAssignmentId(assignment.id)?.resubmitCount > 0">
                      <span class="meta-icon">🔄</span>
                      <span class="meta-label">重提交次数:</span>
                      <span class="meta-value">{{ getSubmissionByAssignmentId(assignment.id)?.resubmitCount }}/{{ assignment.maxResubmit }}</span>
                    </div>
                    <!-- 显示评分 -->
                    <div class="meta-item" v-if="getSubmissionByAssignmentId(assignment.id)?.status === 'GRADED' && getSubmissionByAssignmentId(assignment.id)?.score !== null">
                      <span class="meta-icon">📊</span>
                      <span class="meta-label">得分:</span>
                      <span class="meta-value score-value">{{ getSubmissionByAssignmentId(assignment.id)?.score }}</span>
                    </div>
                  </div>
                  
                  <!-- 显示教师反馈 -->
                  <div v-if="getSubmissionByAssignmentId(assignment.id)?.status === 'GRADED' && getSubmissionByAssignmentId(assignment.id)?.feedback" class="teacher-feedback">
                    <h4 class="feedback-title">教师反馈:</h4>
                    <p class="feedback-content">{{ getSubmissionByAssignmentId(assignment.id)?.feedback }}</p>
                  </div>
                </div>
                
                <div class="assignment-footer">
                  <span class="assignment-status" :class="getAssignmentStatusClass(assignment)">
                    {{ getAssignmentStatusText(assignment) }}
                  </span>
                  <button 
                    class="action-btn"
                    :data-action="getActionType(assignment)"
                    @click="handleAssignmentClick(assignment)"
                  >
                    {{ getAssignmentActionText(assignment) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 申诉弹窗 -->
    <div v-if="showAppealModal" class="modal-overlay" @click="closeAppealModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>提交作业申诉</h3>
          <button class="close-btn" @click="closeAppealModal">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 成功提示 -->
          <div v-if="appealSuccess" class="success-message">
            <div class="success-icon">✓</div>
            <p>申诉提交成功，请等待老师审核！</p>
          </div>
          
          <!-- 申诉表单 -->
          <div v-else>
            <label for="appeal-reason" class="form-label">申诉理由：</label>
            <textarea
              id="appeal-reason"
              v-model="appealReason"
              class="form-textarea"
              placeholder="请详细描述您的申诉理由..."
              rows="5"
              :disabled="submittingAppeal"
            ></textarea>
            
            <!-- 错误提示 -->
            <div v-if="appealError" class="error-message small">
              {{ appealError }}
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            class="btn btn-cancel" 
            @click="closeAppealModal"
            :disabled="submittingAppeal || appealSuccess"
          >
            取消
          </button>
          <button 
            class="btn btn-primary" 
            @click="submitAppeal"
            :disabled="submittingAppeal || appealSuccess || !appealReason.trim()"
          >
            <span v-if="submittingAppeal">提交中...</span>
            <span v-else>确定提交</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import StudentSidebar from '../../components/StudentSidebar.vue'

const route = useRoute()
const router = useRouter()

// 从路由参数中获取courseId
const courseId = computed(() => route.params.courseId as string)

// 筛选条件
const filterType = ref('all')
const filterStatus = ref('all')

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
  status: 'SUBMITTED' | 'GRADED' | 'REJECTED' | 'RESUBMITTED'
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

// 课程信息类型
interface CourseInfo {
  courseId: string
  name: string
}

// 状态变量
const assignments = ref<Assignment[]>([])
const submissions = ref<Submission[]>([])
const courseInfo = ref<CourseInfo | null>(null)
const loading = ref(false)
const error = ref('')
const studentId = ref('')

// 申诉相关状态
const showAppealModal = ref(false)
const currentSubmissionId = ref('')
const appealReason = ref('')
const submittingAppeal = ref(false)
const appealSuccess = ref(false)
const appealError = ref('')

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 获取token
const getToken = () => {
  return localStorage.getItem('token')
}

// 获取学生ID
const getStudentId = async () => {
  // 首先尝试从localStorage获取
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return user.id || ''
    } catch (e) {
      console.error('解析用户信息失败:', e)
    }
  }
  
  // 从API获取当前登录用户信息
  try {
    const token = getToken()
    if (!token) return ''
    
    // 使用指定的API地址
    const response = await axios.get('http://10.70.141.134:8080/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    const userData = response.data
    if (userData.id) {
      // 保存到localStorage以便下次使用
      localStorage.setItem('user', JSON.stringify(userData))
      return userData.id
    }
  } catch (err: any) {
    console.error('Failed to fetch current user:', err)
    // 开发环境下使用测试ID作为备用
    if (import.meta.env.DEV) {
      console.log('开发环境：API获取失败，使用测试ID')
      return '22ead6c4-1f6b-4141-ba88-2402becbc2a8'
    }
  }
  
  return ''
}

// 检查token有效性
const checkAuth = () => {
  const token = getToken()
  console.log('检查认证状态，token存在:', !!token)
  if (!token) {
    // 在开发环境下不自动跳转，便于调试
    if (import.meta.env.DEV) {
      console.log('开发环境：未找到token，但不跳转')
      return true // 开发环境下允许继续执行
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
  router.push('/student/courses')
}

// 获取学生提交记录
const fetchSubmissions = async () => {
  if (!checkAuth() || !studentId.value) return
  
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/students/${studentId.value}/submissions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    submissions.value = response.data.data || []
  } catch (err: any) {
    console.error('Failed to fetch submissions:', err)
  }
}

// 获取作业和测试数据
const fetchAssignments = async () => {
  if (!checkAuth() || !courseId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    // 获取学生ID
    studentId.value = await getStudentId()
    
    // 获取作业列表
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId.value}/assignments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    assignments.value = response.data.data || []
    

    
    // 获取学生提交记录
    await fetchSubmissions()
  } catch (err: any) {
    console.error('Failed to fetch assignments:', err)
    error.value = '获取作业和测试信息失败'
  } finally {
    loading.value = false
  }
}

// 过滤后的作业列表
const filteredAssignments = computed(() => {
  let result = [...assignments.value]
  
  // 按类型过滤
  if (filterType.value !== 'all') {
    result = result.filter(assignment => assignment.type === filterType.value)
  }
  
  // 按状态过滤（检查学生的提交状态）
  if (filterStatus.value !== 'all') {
    if (filterStatus.value === 'pending') {
      // 待完成：过滤掉有提交记录的作业
      result = result.filter(assignment => 
        !submissions.value.some(submission => submission.assignmentId === assignment.id)
      )
    } else if (filterStatus.value === 'completed') {
      // 已完成：过滤出有提交记录的作业
      result = result.filter(assignment => 
        submissions.value.some(submission => submission.assignmentId === assignment.id)
      )
    }
  }
  
  // 按截止时间排序（最近截止的在前）
  result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  
  return result
})

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

// 获取类型名称
const getTypeName = (type: string) => {
  return type === 'ASSIGNMENT' ? '作业' : '测试'
}

// 根据作业ID获取提交记录
const getSubmissionByAssignmentId = (assignmentId: string) => {
  return submissions.value.find(submission => submission.assignmentId === assignmentId)
}

// 获取作业状态类名
const getAssignmentStatusClass = (assignment: Assignment) => {
  const submission = getSubmissionByAssignmentId(assignment.id)
  const now = new Date()
  const deadline = new Date(assignment.deadline)
  
  if (submission) {
    if (submission.status === 'GRADED') {
      return submission.appealReason ? 'status-appealed' : 'status-graded'
    } else if (submission.status === 'RESUBMITTED') {
      return 'status-resubmitted'
    }
    return 'status-submitted'
  } else if (now > deadline) {
    return 'status-overdue'
  }
  return 'status-pending'
}

// 获取作业状态文本
const getAssignmentStatusText = (assignment: Assignment) => {
  const submission = getSubmissionByAssignmentId(assignment.id)
  const now = new Date()
  const deadline = new Date(assignment.deadline)
  
  if (submission) {
    if (submission.status === 'GRADED') {
      if (submission.appealReason) {
        return `已申诉: ${submission.score !== null ? submission.score : '--'}`
      }
      return `已评分: ${submission.score !== null ? submission.score : '--'}`
    } else if (submission.status === 'RESUBMITTED') {
      return '已重提交'
    }
    return '已提交'
  } else if (now > deadline) {
    return '已截止'
  }
  return '待完成'
}

// 获取作业操作类型
const getActionType = (assignment: Assignment) => {
  const submission = getSubmissionByAssignmentId(assignment.id)
  
  if (submission) {
    // 已评分且未申诉，操作类型为申诉
    if (submission.status === 'GRADED' && !submission.appealReason) {
      return 'appeal'
    }
    // 已评分且已申诉，操作类型为已申诉
    else if (submission.status === 'GRADED' && submission.appealReason) {
      return 'appealed'
    }
    // 允许重提交且还有次数，操作类型为重提交
    else if (assignment.allowResubmit && submission.resubmitCount < assignment.maxResubmit) {
      return 'resubmit'
    }
    // 其他情况，操作类型为查看
    return 'view'
  }
  
  return 'submit'
}

// 根据作业ID和评分标准获取评分分数
const getRubricScore = (assignmentId: string, criterionName: string) => {
  const submission = getSubmissionByAssignmentId(assignmentId)
  if (submission && submission.rubricScores && submission.rubricScores.length > 0) {
    const rubricScore = submission.rubricScores.find(score => score.criterion === criterionName)
    return rubricScore?.score || null
  }
  return null
}

// 获取作业操作按钮文本
const getAssignmentActionText = (assignment: Assignment) => {
  const submission = getSubmissionByAssignmentId(assignment.id)
  
  if (submission) {
    // 已评分且未申诉，可以申诉
    if (submission.status === 'GRADED' && !submission.appealReason) {
      return '申诉'
    }
    // 已评分且已申诉，显示已申诉
    else if (submission.status === 'GRADED' && submission.appealReason) {
      return '已申诉'
    }
    // 允许重提交且还有次数
    else if (assignment.allowResubmit && submission.resubmitCount < assignment.maxResubmit) {
      return '重新提交'
    }
    // 其他情况显示查看提交
    return '查看提交'
  }
  
  return assignment.type === 'ASSIGNMENT' ? '提交作业' : '参加测试'
}

// 提交申诉
const submitAppeal = async () => {
  if (!currentSubmissionId.value || !appealReason.value.trim()) {
    appealError.value = '请输入申诉理由'
    return
  }
  
  submittingAppeal.value = true
  appealError.value = ''
  appealSuccess.value = false
  
  try {
    const token = getToken()
    const response = await axios.post(
      `${API_BASE_URL}/submissions/${currentSubmissionId.value}/appeal`,
      { reason: appealReason.value.trim() },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.data.success) {
      appealSuccess.value = true
      // 更新本地提交记录的状态
      const submission = submissions.value.find(s => s.id === currentSubmissionId.value)
      if (submission) {
        submission.appealReason = appealReason.value.trim()
        submission.appealedAt = new Date().toISOString()
      }
      
      // 3秒后关闭弹窗
      setTimeout(() => {
        closeAppealModal()
      }, 3000)
    }
  } catch (err: any) {
    console.error('提交申诉失败:', err)
    appealError.value = err.response?.data?.error?.message || '提交申诉失败，请重试'
  } finally {
    submittingAppeal.value = false
  }
}

// 打开申诉弹窗
const openAppealModal = (submissionId: string) => {
  currentSubmissionId.value = submissionId
  appealReason.value = ''
  appealError.value = ''
  appealSuccess.value = false
  showAppealModal.value = true
}

// 关闭申诉弹窗
const closeAppealModal = () => {
  showAppealModal.value = false
  currentSubmissionId.value = ''
  appealReason.value = ''
  appealError.value = ''
  appealSuccess.value = false
}

// 处理作业点击事件
const handleAssignmentClick = (assignment: Assignment) => {
  const submission = getSubmissionByAssignmentId(assignment.id)
  const actionText = getAssignmentActionText(assignment)
  
  // 处理申诉操作
  if (actionText === '申诉' && submission) {
    openAppealModal(submission.id)
    return
  }
  
  if (assignment.type === 'ASSIGNMENT') {
    if (actionText === '提交作业') {
      // 提交作业或重新提交 - 跳转到提交页面
      router.push(`/student/assignments/${assignment.id}/submit`)
    } else if (actionText === '重新提交' && submission) {
      // 查看提交记录 - 跳转到查看页面
      router.push({
        path: `/student/assignments/${assignment.id}/view`,
        query: { submissionId: submission.id }
      })
    }
  } else if (assignment.type === 'QUIZ') {
    // 测试相关操作
    if (actionText === '参加测试') {
      console.log('参加测试功能待实现', assignment.id)
    } else if (actionText === '查看提交' && submission) {
      console.log('查看测试提交记录:', submission)
    }
  }
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchAssignments()
})
</script>

<style scoped>
.student-course-assignments {
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
  margin: 0 0 10px 0;
  font-weight: 700;
}

.page-header p {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
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

/* 错误提示 */
.error-message {
  color: #d32f2f;
  font-size: 1.1rem;
  margin-bottom: 16px;
}

.error-message.small {
  padding: 8px 12px;
  margin-top: 8px;
  margin-bottom: 0;
  background-color: #fee2e2;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* 成功提示 */
.success-message {
  color: #16a34a;
  background-color: #dcfce7;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-icon {
  width: 40px;
  height: 40px;
  background-color: #16a34a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-textarea {
  width: 90%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
    background-color: #f3f4f6;
    color: #374151;
  }

  .btn-cancel:hover:not(:disabled) {
    background-color: #e5e7eb;
  }

  .btn-primary {
    background-color: #667eea;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #5568d3;
  }

  .btn-warning {
    background-color: #faad14;
    color: white;
  }

  .btn-warning:hover:not(:disabled) {
    background-color: #ffc53d;
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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
  font-size: 1.1rem;
}

/* 筛选器 */
.filter-container {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

/* 作业和测试容器 */
.assignments-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 作业卡片 */
.assignment-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid #667eea;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.assignment-card.assignment-type-assignment {
  border-left-color: #667eea;
}

.assignment-card.assignment-type-quiz {
  border-left-color: #4caf50;
}

/* 作业头部 */
.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.assignment-title {
  font-size: 1.25rem;
  color: #333;
  margin: 0;
  font-weight: 600;
  flex: 1;
}

.assignment-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
}

.assignment-card.assignment-type-assignment .assignment-type-badge {
  background-color: #667eea;
}

.assignment-card.assignment-type-quiz .assignment-type-badge {
  background-color: #4caf50;
}

/* 作业主体 */
.assignment-body {
  margin-bottom: 16px;
}

/* 作业元数据 */
.assignment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

/* 提交信息 */
.submission-info {
  background-color: #f0f8ff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  border-left: 3px solid #4caf50;
}

.submission-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.submission-info .meta-item {
  font-size: 0.85rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 0.9rem;
}

.meta-icon {
  font-size: 1rem;
}

.meta-label {
  font-weight: 500;
}

.meta-value {
  font-weight: 400;
}

/* 评分标准 */
.assignment-rubric {
  margin-bottom: 16px;
}

.assignment-rubric h4 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 8px;
}

.rubric-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rubric-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.criterion-name {
  color: #333;
  font-weight: 500;
}

.criterion-weight {
  color: #666;
}

/* 作业底部 */
.assignment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-status {
  font-size: 0.9rem;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
}

.assignment-status.status-pending {
  background-color: #e3f2fd;
  color: #1976d2;
}

.assignment-status.status-overdue {
  background-color: #ffebee;
  color: #d32f2f;
}

.assignment-status.status-submitted {
  background-color: #e8f5e9;
  color: #388e3c;
}

.assignment-status.status-graded {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .assignment-status.status-resubmitted {
      background-color: #fff1f0;
      color: #fa541c;
    }

    .assignment-status.status-appealed {
      background-color: #f9f0ff;
      color: #722ed1;
    }

.action-btn {
  padding: 6px 16px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background-color: #5568d3;
  transform: translateY(-1px);
}

/* 反馈信息和评分样式 */
.score-value {
  font-weight: bold;
  color: #673ab7;
  font-size: 1.1rem;
}

.teacher-feedback {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.feedback-title {
  color: #495057;
  margin-bottom: 8px;
  font-size: 1rem;
}

.feedback-content {
  color: #212529;
  line-height: 1.6;
  margin: 0;
}

.criterion-score {
  color: #673ab7;
  font-weight: bold;
  margin-left: 12px;
  background-color: #f3e5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* 不同操作按钮的样式 */
.assignment-card .action-btn[data-action="resubmit"] {
  background-color: #ff9800;
}

.assignment-card .action-btn[data-action="resubmit"]:hover {
  background-color: #f57c00;
}

.assignment-card .action-btn[data-action="view"] {
  background-color: #4caf50;
}

.assignment-card .action-btn[data-action="view"]:hover {
  background-color: #43a047;
}

.assignment-card.assignment-type-quiz .action-btn {
  background-color: #4caf50;
}

.assignment-card.assignment-type-quiz .action-btn:hover {
  background-color: #43a047;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 0;
    width: 100vw;
  }
  
  .assignment-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 20px;
  }
  
  .filter-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .assignment-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-btn {
    width: 100%;
    text-align: center;
  }
}
</style>