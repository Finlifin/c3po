<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import router from '../../router'
import TeacherSidebar from '../../components/TeacherSidebar.vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElCard,
  ElTable,
  ElTableColumn,
  ElMessage,
  ElSkeleton,
  ElTag
} from 'element-plus'

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 路由参数
const route = useRoute()
const courseId = route.params.courseId as string

// 学生数据类型定义
interface Student {
  studentId: string
  username: string
  email: string
  status: string
  enrolledAt: string
}

// 批量成绩类型
interface BatchScore {
  studentId: string
  component: string
  value: number
}

// 发布成绩表单类型
interface PublishGradeForm {
  publishAt: string
}

// 状态管理
const students = ref<Student[]>([])
const form = reactive<PublishGradeForm>({
  publishAt: new Date().toISOString().slice(0, 16) // 默认当前时间，精确到分钟
})
const batchScores = ref<BatchScore[]>([])

const isLoading = ref(true)
const error = ref('')
const isPublishing = ref(false)

// 获取学生列表
const fetchStudents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/students`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    // 只获取状态为ENROLLED的学生
    const enrolledStudents = (response.data.data || []).filter((student: Student) => student.status === 'ENROLLED')
    students.value = enrolledStudents
    
    // 初始化批量成绩数组
    batchScores.value = enrolledStudents.map((student: Student) => ({
      studentId: student.studentId,
      component: '',
      value: 0
    }))
  } catch (err: any) {
    console.error('获取学生列表失败:', err)
    error.value = '获取学生列表失败'
  }
}



// 批量发布成绩
const publishGrade = async () => {
  // 表单验证：检查所有必填字段
  const emptyScores = batchScores.value.filter(score => !score.component.trim() || score.value === 0)
  if (emptyScores.length > 0) {
    ElMessage.warning('请填写所有学生的成绩信息')
    return
  }
  
  try {
    isPublishing.value = true
    
    // 格式化发布时间为ISO格式
    const publishAt = new Date(form.publishAt).toISOString()
    
    await axios.post(`${API_BASE_URL}/courses/${courseId}/scores/publish`, {
      publishAt,
      scores: batchScores.value
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    ElMessage.success('成绩发布成功')
    await fetchPublishedGrades()
    
    // 清空成绩输入
    batchScores.value = students.value.map((student: Student) => ({
      studentId: student.studentId,
      component: '',
      value: 0
    }))
    
    // 重置发布时间为当前时间
    form.publishAt = new Date().toISOString().slice(0, 16)
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message )
    console.error('发布成绩失败:', err)
  } finally {
    isPublishing.value = false
  }
}

// 删除成绩
const deleteGrade = async (gradeId: string) => {
  try {
    await axios.delete(`${API_BASE_URL}/courses/${courseId}/scores/${gradeId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    ElMessage.success('成绩删除成功')
    await fetchPublishedGrades()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '成绩删除失败')
    console.error('删除成绩失败:', err)
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('expiresIn')
  router.push('/teacher')
}

// 返回成绩管理
const goBack = () => {
  router.push('/teacher/grade-management')
}

// 获取分数标签类型
const getScoreTagType = (score: number): string => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 70) return 'warning'
  if (score >= 60) return 'info'
  return 'danger'
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    isLoading.value = true
    await fetchStudents()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="publish-grades">
    <!-- 左侧固定菜单栏 -->
    <TeacherSidebar class="left-menu" activeMenu="grade-management" />

    <!-- 右侧主内容区 -->
    <div class="main-content">
      <div class="header">
        <div class="header-left">
          <h2>发布成绩</h2>
          <el-button type="primary" plain @click="goBack" class="back-btn">
            返回成绩管理
          </el-button>
        </div>
      </div>

      <!-- 批量发布成绩表单 -->
      <div class="publish-form-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>批量发布成绩</span>
            </div>
          </template>
          <el-form
            :model="form"
            label-width="120px"
            class="publish-form"
          >
            <el-form-item label="发布时间" required>
              <el-date-picker
                v-model="form.publishAt"
                type="datetime"
                placeholder="选择发布时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm"
              />
            </el-form-item>
            
            <el-form-item>
                <h4 style="margin-bottom: 15px;">学生成绩列表</h4>
                <div v-if="students.length > 0" style="overflow-x: auto; width: 100%;">
                  <el-table
                    :data="students"
                    stripe
                    border
                    style="width: 100%; margin-bottom: 20px;"
                    fit
                    :row-key="(row) => row.studentId"
                  >
                    <el-table-column prop="username" label="学生姓名" width="180" />
                    <el-table-column prop="enrolledAt" label="选课时间" width="220" :formatter="(row) => new Date(row.enrolledAt).toLocaleString()" />
                    <el-table-column label="成绩构成" min-width="200">
                      <template #default="scope">
                        <el-input
                          v-model="batchScores[scope.$index].component"
                          placeholder="请输入成绩构成"
                          size="small"
                          style="width: 100%;"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="成绩" min-width="150">
                      <template #default="scope">
                        <el-input
                          v-model.number="batchScores[scope.$index].value"
                          type="number"
                          placeholder="请输入成绩"
                          :min="0"
                          :max="100"
                          size="small"
                          style="width: 100%;"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <div v-else-if="!isLoading" style="text-align: center; padding: 40px 0;">
                  <el-empty description="暂无已注册学生" />
                </div>
              </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                @click="publishGrade"
                :loading="isPublishing"
                class="publish-btn"
                :disabled="students.length === 0"
              >
                批量发布成绩
              </el-button>

            </el-form-item>
          </el-form>
        </el-card>
      </div>


    </div>
  </div>
</template>

<style scoped>
.publish-grades {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f7fa;
}

.left-menu {
  width: 260px;
  flex-shrink: 0;
}

.main-content {
  margin-left: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  padding: 10px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #eef2f7;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #2d3748;
  font-weight: 700;
}

.back-btn {
  height: 40px;
}

/* 发布表单部分 */
.publish-form-section {
  margin-bottom: 30px;
}

.card-header {
  font-weight: 600;
  color: #2d3748;
  font-size: 1.1rem;
}

.publish-form {
  max-width: 100%;
  padding: 20px 0;
  width: 100%;
}

.publish-btn {
  margin-right: 10px;
}

.student-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-id {
  font-weight: 600;
  color: #2d3748;
}

.student-name {
  color: #718096;
  font-size: 0.9rem;
}



/* 骨架屏 */
.skeleton-item {
  margin-bottom: 20px;
}

.skeleton-row {
  height: 40px;
  background-color: #f0f2f5;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
    padding: 10px;
  }

  .publish-form {
    max-width: 100%;
  }
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

:deep(.el-select) {
  width: 100%;
}
</style>