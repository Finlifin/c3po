<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TeacherSidebar from '../components/TeacherSidebar.vue'

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 路由参数
const route = useRoute()
const router = useRouter()
const courseId = route.params.courseId as string

// 课程信息
const courseName = ref('')

// 获取课程信息
const fetchCourseInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    courseName.value = response.data.data.name
  } catch (err: any) {
    console.error('获取课程信息失败:', err)
  }
}

// 作业数据类型定义
interface Assignment {
  id: string;
  courseId: string;
  title: string;
  type: 'ASSIGNMENT' | 'QUIZ' | 'PROJECT';
  deadline: string;
  allowResubmit: boolean;
  maxResubmit: number;
  gradingRubric: Array<{ criterion: string; weight: number }>;
  visibilityTags: string[];
  releaseAt: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 状态管理
const assignments = ref<Assignment[]>([])
const isLoading = ref(true)
const error = ref('')

// 获取作业列表
const fetchAssignments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/assignments`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    assignments.value = response.data.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取作业列表失败'
    console.error('获取作业列表失败:', err)
  } finally {
    isLoading.value = false
  }
}

// 跳转到编辑作业页面
const goToEditAssignment = (assignmentId: string) => {
  router.push(`/teacher/courses/${courseId}/assignments/${assignmentId}/edit`)
}

// 跳转到查看提交页面
const viewSubmissions = (assignmentId: string) => {
  router.push(`/teacher/assignments/${assignmentId}/submissions`)
}

// 发布作业
const publishAssignment = async (assignmentId: string) => {
  try {
    await axios.post(`${API_BASE_URL}/assignments/${assignmentId}/publish`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    // 更新作业状态
    const assignment = assignments.value.find(a => a.id === assignmentId)
    if (assignment) {
      assignment.published = true
      assignment.publishedAt = new Date().toISOString()
    }
  } catch (err: any) {
    console.error('发布作业失败:', err)
    error.value = err.response?.data?.message || '发布作业失败'
  }
}

// 页面加载时获取作业列表和课程信息
onMounted(() => {
  fetchAssignments()
  fetchCourseInfo()
})
</script>

<template>
  <div class="assignment-management">
    <!-- 左侧固定菜单栏 -->
    <TeacherSidebar class="left-menu" activeMenu="course-management" />

    <!-- 右侧主内容区 -->
    <div class="main-content">
      <div class="header">
        <div>
          <h2>作业管理</h2>
          <p class="course-name">课程：{{ courseName }}</p>
        </div>
      </div>

      <!-- 作业列表 -->
      <div class="assignments-container">
        <div v-if="isLoading" class="loading">加载中...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="assignments.length === 0" class="empty-assignments">
          <p>暂无作业，请先发布作业</p>
        </div>
        <div v-else class="assignments-grid">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="assignment-card"
          >
            <div class="assignment-header">
              <h3 class="assignment-title">{{ assignment.title }}</h3>
              <span
                class="assignment-status"
                :class="{
                  'status-published': assignment.published,
                  'status-draft': !assignment.published
                }"
              >
                {{ assignment.published ? '已发布' : '未发布' }}
              </span>
            </div>
            <div class="assignment-info">
              <div class="info-item">
                <span class="info-label">类型:</span>
                <span class="info-value">{{ assignment.type === 'ASSIGNMENT' ? '作业' : assignment.type === 'QUIZ' ? '测验' : '项目' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">截止时间:</span>
                <span class="info-value">{{ new Date(assignment.deadline).toLocaleString() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">发布时间:</span>
                <span class="info-value">{{ new Date(assignment.releaseAt).toLocaleString() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">允许重新提交:</span>
                <span class="info-value">{{ assignment.allowResubmit ? '是' : '否' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最大重新提交次数:</span>
                <span class="info-value">{{ assignment.maxResubmit }}</span>
              </div>
            </div>
            <div class="assignment-actions">
              <button class="action-btn edit-btn" @click="goToEditAssignment(assignment.id)">编辑</button>
              <button
                v-if="!assignment.published"
                class="action-btn publish-btn"
                @click="publishAssignment(assignment.id)"
              >
                发布
              </button>
              <button class="action-btn view-btn" @click="viewSubmissions(assignment.id)">查看提交</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assignment-management {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f7fa;
}
.left-menu {
  width: 260px;       /* 固定宽度 */
  flex-shrink: 0;     /* 不允许缩小 */
}
.main-content {

  margin-left: 2px;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto; 
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.course-name {
  margin: 5px 0 0 0;
  font-size: 1.8rem;
  font-weight: 600;
  opacity: 0.9;
}

.assignments-container {
  padding: 30px;
  flex: 1;
  background-color: #f5f7fa;
}

.loading, .empty-assignments, .error-message {
  text-align: center;
  padding: 60px 0;
  font-size: 1.2rem;
  color: #666;
}

.loading {
  color: #667eea;
}

.error-message {
  color: #ef4444;
  background-color: #fee2e2;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
}

.assignments-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(300px, 1fr));
      gap: 25px;
    }

.assignment-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #eef2f7;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.assignment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 15px;
}

.assignment-title {
  margin: 0;
  color: #2d3748;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.3;
  flex: 1;
}

.assignment-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-published {
  background-color: #d1fae5;
  color: #065f46;
}

.status-draft {
  background-color: #fef3c7;
  color: #92400e;
}

.assignment-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
  padding: 15px 0;
  border-top: 1px dashed #e2e8f0;
  border-bottom: 1px dashed #e2e8f0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: #2d3748;
  font-weight: 600;
}

.assignment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.action-btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.action-btn.edit-btn {
  background-color: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
}

.action-btn.publish-btn {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.action-btn.edit-btn:hover {
  background-color: #dbeafe;
  border-color: #93c5fd;
  transform: translateY(-2px);
}

.action-btn.publish-btn:hover {
  background-color: #a7f3d0;
  border-color: #6ee7b7;
  transform: translateY(-2px);
}

.action-btn.view-btn {
  background-color: #e0e7ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
}

.action-btn.view-btn:hover {
  background-color: #c7d2fe;
  border-color: #a5b4fc;
  transform: translateY(-2px);
}

.action-btn:hover {
  background-color: #dbeafe;
  border-color: #93c5fd;
  transform: translateY(-2px);
}
</style>