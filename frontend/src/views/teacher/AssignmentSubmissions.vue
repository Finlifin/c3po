<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElButton, ElTag, ElLoading, ElMessageBox, ElMessage } from 'element-plus'
import TeacherSidebar from '../../components/TeacherSidebar.vue'

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 路由参数
const route = useRoute()
const router = useRouter()
const assignmentId = route.params.assignmentId as string

// 状态管理
const submissions = ref<any[]>([])
const isLoading = ref(true)
const error = ref('')
const assignmentInfo = ref({
  title: '',
  courseName: ''
})

// 提交记录类型定义
interface SubmissionResponse {
  id: string;
  assignmentId: string;
  studentId: string;
  status: string;
  score: number | null;
  submittedAt: string;
  attachments: string[];
  feedback: string | null;
  rubricScores: any[];
  appealReason: string | null;
  appealedAt: string | null;
  gradingTeacherId: string | null;
  resubmitCount: number;
  createdAt: string;
  updatedAt: string;
}

// 获取作业基本信息
const fetchAssignmentInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    assignmentInfo.value.title = response.data.data.title
    
    // 获取课程信息
    const courseResponse = await axios.get(`${API_BASE_URL}/courses/${response.data.data.courseId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    assignmentInfo.value.courseName = courseResponse.data.data.name
  } catch (err: any) {
    console.error('获取作业信息失败:', err)
    error.value = '获取作业信息失败'
  }
}

// 获取提交记录
const fetchSubmissions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}/submissions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    submissions.value = response.data.data || []
  } catch (err: any) {
    console.error('获取提交记录失败:', err)
    error.value = err.response?.data?.message || '获取提交记录失败'
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
  try {
    console.log('点击批改按钮，提交ID:', submissionId)
    const targetRoute = `/teacher/submissions/${submissionId}/grade`
    console.log('准备跳转到:', targetRoute)
    
    // 跳转到批改页面
    router.push(targetRoute)
    console.log('跳转命令已执行')
  } catch (err) {
    console.error('进入批改页面失败:', err)
    ElMessage.error('进入批改页面失败')
  }
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
  <div class="assignment-submissions">
    <!-- 左侧固定菜单栏 -->
    <TeacherSidebar class="left-menu" activeMenu="course-management" />

    <!-- 右侧主内容区 -->
    <div class="main-content">
      <div class="header">
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <i class="el-icon-arrow-left"></i>
          </button>
          <div>
            <h2>提交记录</h2>
            <p class="assignment-name">课程：{{ assignmentInfo.courseName }} | 作业：{{ assignmentInfo.title }}</p>
          </div>
        </div>
      </div>

      <!-- 提交记录表格 -->
      <div class="submissions-container">
        <el-loading :visible="isLoading" text="加载中..." />
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <template v-else>
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
          </el-table>
          
          <div v-if="submissions.length === 0" class="empty-submissions">
            <p>暂无学生提交记录</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assignment-submissions {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-2px);
}

.header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.assignment-name {
  margin: 5px 0 0 0;
  font-size: 1rem;
  opacity: 0.9;
}

.submissions-container {
  padding: 30px;
  flex: 1;
  background-color: #f5f7fa;
  position: relative;
}

.error-message {
  color: #ef4444;
  background-color: #fee2e2;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
  text-align: center;
  font-size: 1.1rem;
}

.empty-submissions {
  text-align: center;
  padding: 60px 0;
  font-size: 1.2rem;
  color: #666;
}

:deep(.el-table) {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-table__header-wrapper) {
  background-color: #f8fafc;
}

:deep(.el-table__header th) {
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
}

:deep(.el-table__body tr:hover > td) {
  background-color: #f8fafc;
}

:deep(.el-button--small) {
  padding: 8px 16px;
  border-radius: 6px;
}
</style>