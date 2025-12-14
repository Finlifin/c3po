<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'

// 路由参数
const route = useRoute()
const router = useRouter()
const courseId = route.params.courseId as string

// 课程信息
const courseName = ref('')

// 获取课程信息
const fetchCourseInfo = async () => {
  try {
    const response = await teacherApi.getCourse(courseId)
    courseName.value = response.data.data.name
  } catch (err: any) {
    console.error('获取课程信息失败:', err)
    ElMessage.error('获取课程信息失败')
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
    isLoading.value = true
    const response = await teacherApi.getAssignments(courseId)
    assignments.value = response.data.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取作业列表失败'
    console.error('获取作业列表失败:', err)
    ElMessage.error(error.value)
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
    await teacherApi.publishAssignment(assignmentId)
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
    <div class="content">
      <div class="header">
        <div>
          <h2>作业管理</h2>
          <p class="course-name">课程：{{ courseName }}</p>
        </div>
        <el-button type="primary" @click="router.push(`/teacher/courses/${courseId}/assignments/new`)">
          发布新作业
        </el-button>
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
              <el-button size="small" type="info" @click="viewSubmissions(row.id)">查看提交</el-button>
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
.assignment-management {
  width: 100%;
  min-height: 100%;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.course-name {
  margin: 5px 0 0 0;
  font-size: 16px;
  color: #666;
}

.assignments-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.error-message {
  color: #ff4d4f;
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
