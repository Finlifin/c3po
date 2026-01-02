<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'

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
    visibleTo: [] as string[]
  }
})

// 临时变量，用于日期选择器
const tempReleaseAt = ref('')
const tempDeadline = ref('')

const loading = ref(false)

// 转换为包含时区偏移的ISO 8601格式
const toISOWithTimezone = (date: Date) => {
  const tzo = -date.getTimezoneOffset()
  const diff = tzo >= 0 ? '+' : '-'
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${diff}${pad(Math.abs(tzo / 60))}:${pad(Math.abs(tzo % 60))}`
}

// 发布时间变化处理
const handleReleaseAtChange = (newVal: string) => {
  if (newVal) {
    const date = new Date(newVal)
    assignmentForm.value.visibility.releaseAt = toISOWithTimezone(date)
  }
}

// 截止时间变化处理
const handleDeadlineChange = (newVal: string) => {
  if (newVal) {
    const date = new Date(newVal)
    assignmentForm.value.deadline = toISOWithTimezone(date)
  }
}

// visibleTo 临时字符串变量，用于双向绑定
const visibleToInput = ref('')

// 获取作业详情
const fetchAssignmentDetails = async () => {
  loading.value = true
  try {
    const response = await teacherApi.getAssignment(assignmentId)
    const assignmentData = response.data.data
    
    // 更新作业表单数据
    assignmentForm.value.title = assignmentData.title
    assignmentForm.value.type = assignmentData.type
    assignmentForm.value.deadline = assignmentData.deadline
    assignmentForm.value.allowResubmit = assignmentData.allowResubmit
    assignmentForm.value.maxResubmit = assignmentData.maxResubmit
    assignmentForm.value.gradingRubric = assignmentData.gradingRubric || []
    assignmentForm.value.visibility = {
      releaseAt: assignmentData.releaseAt,
      visibleTo: assignmentData.visibilityTags || []
    }
    
    // 设置临时变量的初始值
    if (assignmentData.releaseAt) {
      tempReleaseAt.value = new Date(assignmentData.releaseAt).toISOString().slice(0, 19)
    }
    if (assignmentData.deadline) {
      tempDeadline.value = new Date(assignmentData.deadline).toISOString().slice(0, 19)
    }
    
    // 设置可见班级/分组的输入值
    visibleToInput.value = assignmentData.visibilityTags?.join(',') || ''
  } catch (err: any) {
    console.error('获取作业详情失败:', err)
    ElMessage.error('获取作业详情失败')
  } finally {
    loading.value = false
  }
}

// 更新作业
const updateAssignment = async () => {
  if (!assignmentForm.value.title) {
    ElMessage.warning('请输入作业标题')
    return
  }
  
  loading.value = true
  try {
    // 发送PATCH请求更新作业
    await teacherApi.updateAssignment(assignmentId, assignmentForm.value)
    
    ElMessage.success('作业更新成功')
    
    // 1.5秒后跳转到作业管理页面
    setTimeout(() => {
      router.push(`/teacher/courses/${courseId}/assignments`)
    }, 1500)
  } catch (err: any) {
    console.error('作业更新失败:', err)
    ElMessage.error(err.message || '作业更新失败')
  } finally {
    loading.value = false
  }
}

const addRubricItem = () => {
  assignmentForm.value.gradingRubric.push({ criterion: '', weight: 0 })
}

const removeRubricItem = (index: number) => {
  assignmentForm.value.gradingRubric.splice(index, 1)
}

// 页面加载时的初始化
onMounted(() => {
  fetchAssignmentDetails()
})
</script>

<template>
  <div class="edit-assignment-container">
    <div class="header">
      <h2>编辑作业</h2>
    </div>
    
    <el-card class="form-card" shadow="hover" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>作业信息</span>
        </div>
      </template>
      
      <el-form 
        @submit.prevent="updateAssignment" 
        class="assignment-form" 
        :model="assignmentForm" 
        label-width="120px"
      >
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
            class="w-full"
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
            class="w-full"
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
            class="w-full"
            @change="handleDeadlineChange"
          />
        </el-form-item>
        
        <el-form-item label="允许重新提交">
          <el-checkbox
            v-model="assignmentForm.allowResubmit"
          >允许重新提交</el-checkbox>
        </el-form-item>
        
        <el-form-item label="最大重交次数" required>
          <el-input-number
            v-model="assignmentForm.maxResubmit"
            :min="0"
            class="w-full"
          />
        </el-form-item>
        
        <el-form-item label="评分标准">
          <div class="rubric-container">
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
                style="width: 150px; margin-right: 10px"
              />
              <el-button type="danger" circle size="small" @click="removeRubricItem(index)">
                <el-icon>x</el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addRubricItem" style="margin-top: 10px">
              添加评分项
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="可见班级/分组">
          <el-input
            v-model="visibleToInput"
            placeholder="请输入班级/分组名称，多个用逗号分隔"
            @input="(value: string) => assignmentForm.visibility.visibleTo = value.split(',').map(item => item.trim()).filter(Boolean)"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="form-actions">
            <el-button @click="router.back()">取消</el-button>
            <el-button type="primary" @click="updateAssignment" :loading="loading">保存修改</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.edit-assignment-container {
  padding: 0;
}

.header {
  margin-bottom: 20px;
}

.form-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  font-weight: bold;
}

.w-full {
  width: 100%;
}

.rubric-container {
  width: 100%;
}

.rubric-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  gap: 10px;
}
</style>
