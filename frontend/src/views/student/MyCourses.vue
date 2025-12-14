<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { studentApi } from '../../api/student'
import PageContainer from '../../components/layout/PageContainer.vue'
import ContentGrid from '../../components/layout/ContentGrid.vue'

const router = useRouter()
const authStore = useAuthStore()

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
            </div>
          </el-card>
    </ContentGrid>
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
  .assignments-btn {
    width: 100%;
  }
}
</style>