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
  // 可以从提交数据中直接使用studentId作为学生标识
  return `学生${studentId.substring(0, 8)}`
}

// 处理批改按钮点击
const handleGrade = (submissionId: string) => {
  router.push(`/teacher/submissions/${submissionId}/grade`)
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
  
  // 为每个提交记录设置学生标识
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
    </div>

    <!-- 提交记录表格 -->
    <div class="submissions-content">
      <el-card shadow="hover">
        <el-table 
          v-loading="isLoading" 
          :data="submissions" 
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="studentName" label="学生姓名" width="180" />
          
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag 
                :type="
                  scope.row.status === 'GRADED' ? 'success' :
                  scope.row.status === 'RESUBMITTED' ? 'warning' :
                  scope.row.status === 'SUBMITTED' ? 'primary' : 'info'
                "
              >
                {{ 
                  scope.row.status === 'GRADED' ? '已批改' :
                  scope.row.status === 'RESUBMITTED' ? '已重交' :
                  scope.row.status === 'SUBMITTED' ? '已提交' : scope.row.status
                }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="score" label="成绩" width="100">
            <template #default="scope">
              {{ scope.row.score || '-' }}
            </template>
          </el-table-column>
          
          <el-table-column prop="submittedAt" label="提交时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.submittedAt) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="resubmitCount" label="重交次数" width="100" />
          
          <el-table-column prop="attachments" label="附件数量" width="100">
            <template #default="scope">
              {{ scope.row.attachments.length }}
            </template>
          </el-table-column>
          
          <el-table-column prop="feedback" label="已反馈" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.feedback ? 'success' : 'info'">
                {{ scope.row.feedback ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button 
                v-if="shouldShowGradeButton(scope.row.status)"
                type="primary" 
                size="small" 
                @click="handleGrade(scope.row.id)"
              >
                批改
              </el-button>
              <span v-else-if="scope.row.status === 'GRADED'">已批改</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="暂无学生提交记录" />
          </template>
        </el-table>
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
