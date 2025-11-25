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
const assignmentId = route.params.assignmentId as string

// 作业表单
const assignmentForm = ref({
  title: '',
  type: '',
  deadline: '',
  allowResubmit: true,
  maxResubmit: 3,
  gradingRubric: [
    { criterion: '正确性', weight: 0.5 },
    { criterion: '代码规范', weight: 0.3 },
    { criterion: '创新性', weight: 0.2 }
  ],
  visibility: {
    releaseAt: '',
    visibleTo: []
  }
})

// 临时变量，用于日期选择器（不包含时区）
const tempReleaseAt = ref('')
const tempDeadline = ref('')

// 转换为包含时区偏移的ISO 8601格式
const toISOWithTimezone = (date: Date) => {
  const tzo = -date.getTimezoneOffset()
  const diff = tzo >= 0 ? '+' : '-'
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${diff}${pad(Math.abs(tzo / 60))}:${pad(Math.abs(tzo % 60))}`
}

// 发布时间变化处理
const handleReleaseAtChange = (newVal: string) => {
  const date = new Date(newVal)
  assignmentForm.value.visibility.releaseAt = toISOWithTimezone(date)
}

// 截止时间变化处理
const handleDeadlineChange = (newVal: string) => {
  const date = new Date(newVal)
  assignmentForm.value.deadline = toISOWithTimezone(date)
}

// visibleTo 临时字符串变量，用于双向绑定
const visibleToInput = ref('')

// 错误信息
const error = ref('')
const success = ref('')

// 获取作业详情
const fetchAssignmentDetails = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    const assignmentData = response.data.data
    
    // 更新作业表单数据
    assignmentForm.value.title = assignmentData.title
    assignmentForm.value.type = assignmentData.type
    assignmentForm.value.deadline = assignmentData.deadline
    assignmentForm.value.allowResubmit = assignmentData.allowResubmit
    assignmentForm.value.maxResubmit = assignmentData.maxResubmit
    assignmentForm.value.gradingRubric = assignmentData.gradingRubric
    assignmentForm.value.visibility = {
      releaseAt: assignmentData.releaseAt,
      visibleTo: assignmentData.visibilityTags || []
    }
    
    // 设置临时变量的初始值（不包含时区，用于日期选择器）
    // 移除时区信息，转换为YYYY-MM-DDTHH:mm:ss格式
    tempReleaseAt.value = new Date(assignmentData.releaseAt).toISOString().slice(0, 19)
    tempDeadline.value = new Date(assignmentData.deadline).toISOString().slice(0, 19)
    
    // 设置可见班级/分组的输入值
    visibleToInput.value = assignmentData.visibilityTags?.join(',') || ''
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取作业详情失败'
    console.error('获取作业详情失败:', err)
  }
}

// 更新作业
const updateAssignment = async () => {
  try {
    // 发送PATCH请求更新作业
    await axios.patch(`${API_BASE_URL}/assignments/${assignmentId}`, assignmentForm.value, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    // 显示成功信息
    success.value = '作业更新成功'
    
    // 3秒后跳转到作业管理页面
    setTimeout(() => {
      router.push(`/teacher/courses/${courseId}/assignments`)
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || '作业更新失败'
    console.error('作业更新失败:', err)
  }
}

// 页面加载时的初始化
onMounted(() => {
  fetchAssignmentDetails()
})
</script>

<template>
  <div class="publish-assignment">
    <!-- 左侧固定菜单栏 -->
    <TeacherSidebar activeMenu="course-management" />

    <!-- 右侧主内容区 -->
    <el-container class="main-content">
      <el-header class="header">
        <h2>编辑作业</h2>
      </el-header>
      <el-main class="content-container">
        <el-card class="form-card" shadow="hover">
          <h3>作业信息</h3>
          
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>
          
          <el-form @submit.prevent="updateAssignment" class="assignment-form" :model="assignmentForm" label-width="120px">
            <el-form-item label="作业标题" prop="title" required>
              <el-input
                v-model="assignmentForm.title"
                placeholder="请输入作业标题"
              />
            </el-form-item>
            
            <el-form-item label="作业类型" prop="type" required>
              <el-select
                v-model="assignmentForm.type"
                placeholder="请选择作业类型"
              >
                <el-option label="作业" value="ASSIGNMENT" />
                <el-option label="测验" value="QUIZ" />
                <el-option label="项目" value="PROJECT" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="发布时间" required>
              <el-date-picker
                v-model="tempReleaseAt"
                type="datetime"
                placeholder="选择发布时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
                @change="handleReleaseAtChange"
              />
            </el-form-item>
            
            <el-form-item label="截止时间" required>
              <el-date-picker
                v-model="tempDeadline"
                type="datetime"
                placeholder="选择截止时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
                @change="handleDeadlineChange"
              />
            </el-form-item>
            
            <el-form-item label="允许重新提交">
              <el-checkbox
                v-model="assignmentForm.allowResubmit"
              >允许重新提交</el-checkbox>
            </el-form-item>
            
            <el-form-item label="最大重新提交次数" required>
              <el-input-number
                v-model="assignmentForm.maxResubmit"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="评分标准">
              <div v-for="(rubric, index) in assignmentForm.gradingRubric" :key="index" class="rubric-item">
                <el-input
                  v-model="rubric.criterion"
                  placeholder="评分项"
                  style="flex: 1; margin-right: 10px"
                />
                <el-input-number
                  v-model="rubric.weight"
                  :step="0.1"
                  :min="0"
                  :max="1"
                  placeholder="权重"
                  style="width: 150px"
                />
              </div>
            </el-form-item>
            
            <el-form-item label="可见班级/分组">
              <el-input
                v-model="visibleToInput"
                placeholder="请输入班级/分组名称，多个用逗号分隔"
                @input="(value) => assignmentForm.visibility.visibleTo = value.split(',').map(item => item.trim()).filter(Boolean)"
              />
            </el-form-item>
            
            <el-form-item class="form-actions">
              <el-button type="default" @click="router.back()">取消</el-button>
              <el-button type="primary" @click="updateAssignment">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.publish-assignment {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f7fa;
}

.main-content {
  margin-left: 250px;
  flex: 1;
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

.logout-btn {
  color: white;
  font-size: 1rem;
}

.content-container {
  padding: 30px;
  background-color: #f5f7fa;
}

.form-card {
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #eef2f7;
  max-width: 1200px;
  margin: 0 auto;
}

.form-card h3 {
  margin: 0 0 25px 0;
  color: #2d3748;
  font-size: 1.4rem;
  font-weight: 700;
}

.error-message {
  background-color: #fee2e2;
  color: #ef4444;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.success-message {
  background-color: #d1fae5;
  color: #065f46;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.assignment-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.rubric-item {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  align-items: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 15px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}
</style>