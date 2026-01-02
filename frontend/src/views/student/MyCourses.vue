<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentAuthStore } from '../../stores/auth_student'
import { studentApi } from '../../api/student'
import PageContainer from '../../components/layout/PageContainer.vue'
import ContentGrid from '../../components/layout/ContentGrid.vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useStudentAuthStore()

// User data
const user = computed(() => authStore.user)

// 学生课程响应数据类型
interface StudentCourseResponse {
  courseId: string
  name: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  selectionStatus: 'ENROLLED' | 'PENDING' | 'DROPPED'
  selectedAt: string
  pendingAssignments: number
  completedAssignments: number
  totalAssignments: number
}

// 状态变量
const courses = ref<StudentCourseResponse[]>([])
const loading = ref(false)
const error = ref('')

// AI解析相关状态
const aiDrawerVisible = ref(false)
const aiLoading = ref(false)
const currentCourse = ref<StudentCourseResponse | null>(null)
const aiResponse = ref<any>(null)
const aiMessage = ref('这门课有什么？')

// 获取学生已选课程
const fetchEnrolledCourses = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (!user.value?.id) {
      await authStore.fetchUserInfo()
    }
    
    if (!user.value?.id) {
      throw new Error('无法获取用户信息')
    }
    
    const response = await studentApi.getMyCourses(user.value.id)
    
    let courseData: StudentCourseResponse[] = []
    
    // 如果response.data本身是数组，直接使用
    if (Array.isArray(response.data)) {
      courseData = response.data
    } 
    // 否则尝试从response.data.data中获取数组（常见的REST API格式）
    else if (response.data && Array.isArray(response.data.data)) {
      courseData = response.data.data
    }
    // 或者尝试从response.data.courses中获取数组
    else if (response.data && Array.isArray(response.data.courses)) {
      courseData = response.data.courses
    }
    
    // 只保留selectionStatus为ENROLLED的课程
    courses.value = courseData.filter((course: StudentCourseResponse) => 
      course.selectionStatus === 'ENROLLED'
    )
    
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('Failed to fetch enrolled courses:', err)
  } finally {
    loading.value = false
  }
}

// 跳转到课程学习页面
const learnCourse = (courseId: string) => {
  router.push(`/student/courses/${courseId}`)
}

// 跳转到作业/测试列表页面
const viewAssignments = (courseId: string) => {
  router.push(`/student/courses/${courseId}/assignments`)
}

// 打开AI解析抽屉
const openAiDrawer = (course: StudentCourseResponse) => {
  currentCourse.value = course
  aiResponse.value = null
  aiDrawerVisible.value = true
  // 默认发送请求
  setTimeout(() => {
    sendAiRequest()
  }, 1000)
}

// 发送AI请求
const sendAiRequest = async () => {
  if (!currentCourse.value) return
  
  aiLoading.value = true
  
  try {
    const response = await request({
      url: 'http://10.70.141.134:8080/api/v1/assistant/chat',
      method: 'post',
      data: {
        context: {
          courseId: currentCourse.value.courseId
        },
        messages: [
          {
            role: 'USER',
            content: aiMessage.value
          }
        ],
        preferences: {
          language: 'zh-CN',
          style: 'EDUCATIONAL',
          maxLength: 2000,
          includeReferences: true,
          includeSuggestions: true
        },
        stream: false
      }
    })
    
    if (response.data.success) {
      aiResponse.value = response.data.data
    } else {
      ElMessage.error('AI解析失败: ' + response.data.error?.message || '未知错误')
    }
  } catch (err: any) {
    console.error('AI request failed:', err)
    ElMessage.error('AI解析请求失败: ' + err.response?.data?.message || '网络错误')
  } finally {
    aiLoading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchEnrolledCourses()
})

// 计算作业完成率
const getCompletionRate = (course: StudentCourseResponse): string => {
  if (course.totalAssignments === 0) return '0%'
  return `${Math.round((course.completedAssignments / course.totalAssignments) * 100)}%`
}

// 获取课程状态样式类名
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'PUBLISHED':
      return 'status-published'
    case 'DRAFT':
      return 'status-draft'
    case 'PENDING_REVIEW':
      return 'status-pending'
    case 'ARCHIVED':
      return 'status-archived'
    default:
      return ''
  }
}

// 获取课程状态显示文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'PUBLISHED':
      return '已发布'
    case 'DRAFT':
      return '草稿'
    case 'PENDING_REVIEW':
      return '审核中'
    case 'ARCHIVED':
      return '已归档'
    default:
      return status
  }
}

</script>

<template>
  <PageContainer>
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>我的课程</h1>
      <p v-if="user">
        欢迎，{{ user.username }}！以下是您当前选修的课程列表。
      </p>
    </div>
    <!-- 加载状态和错误提示 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载课程信息...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button class="retry-btn" @click="fetchEnrolledCourses">重新加载</button>
    </div>
    <!-- 课程列表 -->
    <div v-else-if="courses.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>暂无选修课程</h3>
      <p>您还没有选修任何课程，请前往选课页面浏览并选择课程。</p>
      <button class="go-selection-btn" @click="router.push('/student/course-selection')">
        去选课
      </button>
    </div>
    <ContentGrid v-else min-width="350px" gap="md" :columns="{ xs: 1, sm: 1, md: 2, lg: 3 }">
      <el-card
        v-for="course in courses" 
        :key="course.courseId"
        class="course-card"
        shadow="hover"
      >
            <div class="course-header">
              <h3 class="course-name">{{ course.name }}</h3>
              <span :class="['course-status', getStatusClass(course.status)]">
                {{ getStatusText(course.status) }}</span>
            </div>
            <div class="course-body">
              <div class="course-meta">
                <div class="meta-item">
                  <span class="meta-icon">📅</span>
                  <span class="meta-label">选课时间:</span>
                  <span class="meta-value">{{ new Date(course.selectedAt).toLocaleDateString() }}</span>
                </div>
              </div>
              <div class="assignment-stats">
                <h4>作业完成情况</h4>
                <div v-if="course.totalAssignments === 0" class="no-assignments">
                  <p>暂无作业</p>
                </div>
                <template v-else>
                  <div class="stats-row">
                    <div class="stat-item">
                      <span class="stat-label">待完成:</span>
                      <span class="stat-value pending">{{ course.pendingAssignments }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">已完成:</span>
                      <span class="stat-value completed">{{ course.completedAssignments }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">总计:</span>
                      <span class="stat-value total">{{ course.totalAssignments }}</span>
                    </div>
                  </div>
                  <div class="completion-rate">
                    <div class="rate-bar">
                      <div 
                        class="rate-fill" 
                        :style="{ width: getCompletionRate(course) }"
                      ></div>
                    </div>
                    <span class="rate-text">完成率: {{ getCompletionRate(course) }}</span>
                  </div>
                </template>
              </div>
            </div>
            <div class="course-footer">
              <button 
                class="learn-btn" 
                @click="learnCourse(course.courseId)"
                :disabled="course.status !== 'PUBLISHED'"
              >
                <span v-if="course.status === 'PUBLISHED'">学习课程</span>
                <span v-else>课程未发布</span>
              </button>
              <button 
                class="assignments-btn" 
                @click="viewAssignments(course.courseId)"
                :disabled="course.status !== 'PUBLISHED' || course.totalAssignments === 0"
              >
                查看作业/测试
              </button>
              <button 
                class="ai-btn" 
                @click="openAiDrawer(course)"
                :disabled="course.status !== 'PUBLISHED'"
              >
                AI解析
              </button>
            </div>
          </el-card>
    </ContentGrid>
    
    <!-- AI解析抽屉 -->
    <el-drawer
      v-model="aiDrawerVisible"
      title="课程AI解析"
      direction="rtl"
      size="60%"
    >
      <div v-if="currentCourse" class="ai-drawer-content">
        <div class="ai-course-info">
          <h3>{{ currentCourse.name }}</h3>
          <p class="course-id">课程ID: {{ currentCourse.courseId }}</p>
        </div>
        
        <div class="ai-input-section">
          <el-input
            v-model="aiMessage"
            type="textarea"
            placeholder="请输入您的问题..."
            :rows="3"
            class="ai-message-input"
          ></el-input>
          <el-button 
            type="primary" 
            @click="sendAiRequest"
            :loading="aiLoading"
            class="ai-send-btn"
          >
            {{ aiLoading ? '发送中...' : '发送' }}
          </el-button>
        </div>
        
        <div class="ai-response-section">
          <h4 class="response-title">AI解析结果</h4>
          <div v-if="aiLoading" class="ai-loading">
            <el-skeleton :rows="6" animated />
          </div>
          <div v-else-if="aiResponse" class="ai-response">
            <div class="ai-answer" v-html="aiResponse.answer"></div>
            
            <div v-if="aiResponse.suggestions && aiResponse.suggestions.length > 0" class="ai-suggestions">
              <h5>学习建议:</h5>
              <ul>
                <li v-for="(suggestion, index) in aiResponse.suggestions" :key="index">
                  {{ suggestion.title }}
                </li>
              </ul>
            </div>
            
            <div v-if="aiResponse.references && aiResponse.references.length > 0" class="ai-references">
              <h5>参考资料:</h5>
              <ul>
                <li v-for="(reference, index) in aiResponse.references" :key="index">
                  {{ reference }}
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="ai-no-response">
            <p>点击发送按钮获取AI解析结果</p>
          </div>
        </div>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<style scoped>
/* 页面标题 */
.page-header {
  margin-bottom: var(--space-8);
}

.page-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
  font-weight: 700;
}

.page-header p {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-5);
  text-align: center;
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-4);
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
  padding: var(--space-16) var(--space-5);
  text-align: center;
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
}

.error-message {
  font-size: var(--text-lg);
  color: var(--error);
  margin-bottom: var(--space-5);
}

.retry-btn {
  padding: var(--space-3) var(--space-5);
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-5);
  text-align: center;
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-5);
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.empty-state p {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-5) 0;
  max-width: 500px;
}

.go-selection-btn {
  padding: var(--space-3) var(--space-6);
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.go-selection-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 课程卡片 */
.course-card {
  transition: all var(--transition-base);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.course-header {
  padding: var(--space-5);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-secondary);
}

.course-name {
  font-size: 1.3rem;
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
  flex: 1;
}

.course-status {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-published {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.status-draft {
  background-color: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.status-pending {
  background-color: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.status-archived {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.course-body {
  padding: var(--space-5);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.meta-icon {
  font-size: 1.1rem;
}

.meta-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.meta-value {
  color: var(--text-primary);
}

.assignment-stats {
  margin-top: auto;
}

.assignment-stats h4 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.no-assignments {
  text-align: center;
  padding: 15px 0;
  color: #9e9e9e;
  font-size: 0.95rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.stat-value.pending {
  color: #ff9800;
}

.stat-value.completed {
  color: #4caf50;
}

.stat-value.total {
  color: #667eea;
}

.completion-rate {
  margin-top: 10px;
}

.rate-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.rate-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.course-footer {
  padding: var(--space-5);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.learn-btn {
  padding: var(--space-3) var(--space-6);
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.learn-btn:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.learn-btn:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
  transform: none;
}

.assignments-btn {
  padding: var(--space-3) var(--space-6);
  background-color: var(--success);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.assignments-btn:hover:not(:disabled) {
  background-color: #0ea571;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.assignments-btn:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
  transform: none;
}

/* AI按钮样式 */
.ai-btn {
  padding: var(--space-3) var(--space-6);
  background-color: #9c27b0;
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ai-btn:hover:not(:disabled) {
  background-color: #7b1fa2;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.ai-btn:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
  transform: none;
}

/* AI抽屉样式 */
.ai-drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--space-5);
}

.ai-course-info {
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--gray-200);
}

.ai-course-info h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.course-id {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.ai-input-section {
  margin-bottom: var(--space-6);
}

.ai-message-input {
  margin-bottom: var(--space-3);
}

.ai-send-btn {
  width: 100%;
}

.ai-response-section {
  flex: 1;
  overflow-y: auto;
}

.response-title {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin: 0 0 var(--space-4) 0;
}

.ai-loading {
  margin-bottom: var(--space-4);
}

.ai-response {
  background-color: var(--bg-secondary);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.ai-answer {
  line-height: 1.8;
  margin-bottom: var(--space-5);
}

.ai-suggestions, .ai-references {
  margin-top: var(--space-4);
}

.ai-suggestions h5, .ai-references h5 {
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.ai-suggestions ul, .ai-references ul {
  padding-left: var(--space-6);
  margin: 0;
}

.ai-suggestions li, .ai-references li {
  margin-bottom: var(--space-2);
  line-height: 1.6;
}

.ai-no-response {
  text-align: center;
  padding: var(--space-10);
  color: var(--text-secondary);
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-md);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .stats-row {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .course-footer {
    flex-direction: column;
  }
  
  .learn-btn,
  .assignments-btn,
  .ai-btn {
    width: 100%;
  }
  
  .ai-drawer-content {
    padding: var(--space-3);
  }
}
</style>