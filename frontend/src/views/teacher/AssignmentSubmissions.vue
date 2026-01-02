<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

// 路由参数
const route = useRoute()
const router = useRouter()
const assignmentId = route.params.assignmentId as string

// 状态管理
const submissions = ref<any[]>([])
const isLoading = ref(true)
const assignmentInfo = ref({
  title: '',
  courseName: ''
})

// 获取作业基本信息
const fetchAssignmentInfo = async () => {
  try {
    const response = await teacherApi.getAssignment(assignmentId)
    assignmentInfo.value.title = response.data.data.title
    
    // 获取课程信息
    const courseResponse = await teacherApi.getCourse(response.data.data.courseId)
    assignmentInfo.value.courseName = courseResponse.data.data.name
  } catch (err: any) {
    console.error('获取作业信息失败:', err)
    ElMessage.error('获取作业信息失败')
  }
}

// 获取提交记录
const fetchSubmissions = async () => {
  try {
    const response = await teacherApi.getAssignmentSubmissions(assignmentId)
    submissions.value = response.data.data || []
  } catch (err: any) {
    console.error('获取提交记录失败:', err)
    ElMessage.error(err.message || '获取提交记录失败')
  } finally {
    isLoading.value = false
  }
}

// 由于没有学生信息API，暂时使用默认学生名
const getStudentName = (studentId: string) => {
  return `学生${studentId.substring(0, 8)}`
}

// 处理批改按钮点击
const handleGrade = (submissionId: string) => {
  router.push(`/teacher/submissions/${submissionId}/grade`)
}

// 处理批量批改按钮点击
const handleBatchGrade = () => {
  router.push(`/teacher/assignments/${assignmentId}/batch-grade`)
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 判断是否需要显示批改按钮
const shouldShowGradeButton = (status: string) => {
  return status !== 'GRADED'
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取数据
onMounted(async () => {
  await Promise.all([fetchAssignmentInfo(), fetchSubmissions()])
  
  for (const submission of submissions.value) {
    submission.studentName = getStudentName(submission.studentId)
  }
})
</script>

<template>
  <div class="assignment-submissions-container">
    <div class="header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="goBack" class="back-btn" />
        <div class="header-info">
          <h2>提交记录</h2>
          <p class="assignment-name">课程：{{ assignmentInfo.courseName }} | 作业：{{ assignmentInfo.title }}</p>
        </div>
      </div>
      <!-- 添加批量批改按钮 -->
      <div class="header-right">
        <el-button 
          type="primary" 
          @click="handleBatchGrade"
        >
          批量批改
        </el-button>
      </div>
    </div>

    <!-- 提交记录表格 -->
    <div class="submissions-content">
      <el-card shadow="hover">
        <div v-if="isLoading" class="loading">加载中...</div>
        <table v-else class="custom-table">
          <thead>
            <tr>
              <th>学生姓名</th>
              <th>状态</th>
              <th>成绩</th>
              <th>提交时间</th>
              <th>重交次数</th>
              <th>附件数量</th>
              <th>评语</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in submissions" :key="item.id">
              <td>{{ item.studentName }}</td>
              <td>
                <span 
                  class="status-tag"
                  :class="{
                    'status-graded': item.status === 'GRADED',
                    'status-resubmitted': item.status === 'RESUBMITTED',
                    'status-submitted': item.status === 'SUBMITTED'
                  }"
                >
                  {{
                    item.status === 'GRADED' ? '已批改' :
                    item.status === 'RESUBMITTED' ? '已重交' :
                    item.status === 'SUBMITTED' ? '已提交' : item.status
                  }}
                </span>
              </td>
              <td>{{ item.score || '-' }}</td>
              <td>{{ formatDate(item.submittedAt) }}</td>
              <td>{{ item.resubmitCount }}</td>
              <td>{{ item.attachments?.length || 0 }}</td>
              <td>
                <span>
                  {{ item.feedback  }}
                </span>
              </td>
              <td>
                <el-button 
                  v-if="shouldShowGradeButton(item.status)"
                  type="primary" 
                  size="small" 
                  @click="handleGrade(item.id)"
                >
                  批改
                </el-button>
                <span v-else-if="item.status === 'GRADED'">已批改</span>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="submissions.length === 0">
              <td colspan="8" class="empty-row">暂无学生提交记录</td>
            </tr>
          </tbody>
        </table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.assignment-submissions-container {
  padding: 0;
}

.header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-info h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #2d3748;
  font-weight: 700;
}

.assignment-name {
  margin: 5px 0 0 0;
  font-size: 1rem;
  color: #718096;
}

.submissions-content {
  margin-top: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  text-align: center;
}

.custom-table th,
.custom-table td {
  padding: 12px 8px;
  border: 1px solid #ebeef5;
  vertical-align: middle;
}

.custom-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.status-graded {
  background-color: #67c23a;
}

.status-resubmitted {
  background-color: #e6a23c;
}

.status-submitted {
  background-color: #409eff;
}

.feedback-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #dcdfe6;
  color: #606266;
}

.feedback-yes {
  background-color: #67c23a;
  color: white;
}

.empty-row {
  text-align: center;
  color: #909399;
  font-style: italic;
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>