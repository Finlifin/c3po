<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TeacherSidebar from '../../components/TeacherSidebar.vue'
// 引入Element UI Plus组件
import { ElTable, ElTableColumn, ElButton, ElTag, ElLoading, ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

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
      ElMessage.success('作业发布成功')
    }
  } catch (err: any) {
    console.error('发布作业失败:', err)
    const errorMessage = err.response?.data?.message || '发布作业失败'
    error.value = errorMessage
    ElMessage.error(errorMessage)
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
        <el-table
          v-loading="isLoading"
          :data="assignments"
          style="width: 100%"
          empty-text="暂无作业，请先发布作业"
          border
        >
          <el-table-column prop="title" label="作业标题" min-width="200">
            <template #default="{row}">
              <strong>{{ row.title }}</strong>
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{row}">
              <el-tag size="small"
                :type="row.type === 'ASSIGNMENT' ? 'primary' : row.type === 'QUIZ' ? 'success' : 'info'"
              >
                {{ row.type === 'ASSIGNMENT' ? '作业' : row.type === 'QUIZ' ? '测验' : '项目' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="100">
            <template #default="{row}">
              <el-tag size="small" :type="row.published ? 'success' : 'warning'">
                {{ row.published ? '已发布' : '未发布' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="deadline" label="截止时间" width="180">
            <template #default="{row}">
              {{ new Date(row.deadline).toLocaleString() }}
            </template>
          </el-table-column>
          
          <el-table-column prop="releaseAt" label="发布时间" width="180">
            <template #default="{row}">
              {{ new Date(row.releaseAt).toLocaleString() }}
            </template>
          </el-table-column>
          
          <el-table-column prop="allowResubmit" label="允许重新提交" width="120">
            <template #default="{row}">
              <el-tag size="small" :type="row.allowResubmit ? 'success' : 'danger'">
                {{ row.allowResubmit ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="maxResubmit" label="最大重新提交次数" width="140">
            <template #default="{row}">
              {{ row.maxResubmit }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{row}">
              <el-button size="small" type="primary" @click="goToEditAssignment(row.id)">编辑</el-button>
              <el-button 
                v-if="!row.published"
                size="small" 
                type="success" 
                @click="publishAssignment(row.id)"
              >发布</el-button>
              <el-button size="small" type="info" @click="viewSubmissions(row.id)"style="background-color: #67C23A; border-color: #67C23A; color: white;">查看提交</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.left-menu {
  width: 260px;       /* 固定宽度 */
  flex-shrink: 0;     /* 不允许缩小 */
}

.main-content {
  margin-left: 100px;
  flex: 1;
  width: 105%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  overflow-y: auto;
}

.error-message {
  color: #ef4444;
  background-color: #fee2e2;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
}

/* Element Plus表格样式调整 */
:deep(.el-table) {
  margin-bottom: 20px;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

:deep(.el-table__header th) {
  background-color: #f8f9fa;
  font-weight: 600;
}
</style>