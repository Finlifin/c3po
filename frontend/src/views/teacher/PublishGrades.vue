<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'

// 路由参数
const route = useRoute()
const router = useRouter()
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
const isPublishing = ref(false)

// 获取学生列表
const fetchStudents = async () => {
  try {
    const response = await teacherApi.getCourseStudents(courseId)
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
    ElMessage.error('获取学生列表失败')
  }
}

// 批量发布成绩
const publishGrade = async () => {
  // 表单验证：检查所有必填字段
  const emptyScores = batchScores.value.filter(score => !score.component.trim())
  if (emptyScores.length > 0) {
    ElMessage.warning('请填写所有学生的成绩构成')
    return
  }
  
  try {
    isPublishing.value = true
    
    // 格式化发布时间为ISO格式
    const publishAt = new Date(form.publishAt).toISOString()
    
    await teacherApi.publishCourseScores(courseId, {
      publishAt,
      scores: batchScores.value
    })
    
    ElMessage.success('成绩发布成功')
    
    // 重置发布时间为当前时间
    form.publishAt = new Date().toISOString().slice(0, 16)
    
    // 1.5秒后返回成绩管理页面
    setTimeout(() => {
      goBack()
    }, 1500)
    
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '发布成绩失败')
    console.error('发布成绩失败:', err)
  } finally {
    isPublishing.value = false
  }
}

// 返回成绩管理
const goBack = () => {
  router.push('/teacher/grade-management')
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
  <div class="publish-grades-container">
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
      <el-card shadow="hover" v-loading="isLoading">
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
          
          <el-form-item label-width="0">
              <h4 style="margin-bottom: 15px;">学生成绩列表</h4>
              <div v-if="students.length > 0" style="overflow-x: auto; width: 100%;">
                <el-table
                  :data="students"
                  stripe
                  border
                  style="width: 100%; margin-bottom: 20px;"
                  fit
                  :row-key="(row: any) => row.studentId"
                >
                  <el-table-column prop="username" label="学生姓名" width="180" />
                  <el-table-column prop="enrolledAt" label="选课时间" width="220">
                    <template #default="scope">
                      {{ new Date(scope.row.enrolledAt).toLocaleString() }}
                    </template>
                  </el-table-column>
                  <el-table-column label="成绩构成" min-width="200">
                    <template #default="scope">
                      <el-input
                        v-if="batchScores[scope.$index]"
                        v-model="batchScores[scope.$index]!.component"
                        placeholder="请输入成绩构成 (如: 期中考试)"
                        size="small"
                        style="width: 100%;"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="成绩" min-width="150">
                    <template #default="scope">
                      <el-input-number
                        v-if="batchScores[scope.$index]"
                        v-model="batchScores[scope.$index]!.value"
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
</template>

<style scoped>
.publish-grades-container {
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 20px;
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
