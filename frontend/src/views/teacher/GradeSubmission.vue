<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document, DocumentCopy } from '@element-plus/icons-vue'

// 路由参数
const route = useRoute()
const router = useRouter()
const submissionId = route.params.submissionId as string

// 状态管理
const submission = ref<any>(null)
const assignment = ref<any>(null)
const studentInfo = ref({ name: '' })
const isLoading = ref(true)
const isSubmitting = ref(false)

// 评分表单数据
const formData = ref({
  score: 0,
  rubricScores: [] as Array<{ criterion: string; score: number }>,
  feedback: '',
  publish: true
})

// 获取提交记录详情
const fetchSubmission = async () => {
  try {
    const response = await teacherApi.getSubmission(submissionId)
    submission.value = response.data.data
    
    // 获取学生信息
    await fetchStudentInfo(submission.value.studentId)
    // 获取作业信息
    await fetchAssignment(submission.value.assignmentId)
  } catch (err: any) {
    console.error('获取提交记录失败:', err)
    ElMessage.error('获取提交记录失败')
  } finally {
    isLoading.value = false
  }
}

// 获取作业信息
const fetchAssignment = async (assignmentId: string) => {
  try {
    const response = await teacherApi.getAssignment(assignmentId)
    assignment.value = response.data.data
    
    // 初始化评分标准
    initRubricScores()
  } catch (err: any) {
    console.error('获取作业信息失败:', err)
    ElMessage.error('获取作业信息失败')
  }
}

// 由于没有学生信息API，使用默认学生信息
const fetchStudentInfo = async (studentId: string) => {
  try {
    // 直接设置学生信息，使用studentId作为标识
    studentInfo.value = { name: `学生${studentId.substring(0, 8)}` }
  } catch (err: any) {
    console.error('设置学生信息失败:', err)
  }
}

// 初始化评分标准
const initRubricScores = () => {
  if (assignment.value?.gradingRubric) {
    formData.value.rubricScores = assignment.value.gradingRubric.map((rubric: any) => ({
      criterion: rubric.criterion,
      score: 0
    }))
  }
}

// 计算总分数
const calculateTotalScore = () => {
  let total = 0
  if (assignment.value?.gradingRubric && formData.value.rubricScores.length > 0) {
    assignment.value.gradingRubric.forEach((rubric: any, index: number) => {
      if (formData.value.rubricScores[index]) {
        const score = formData.value.rubricScores[index].score * rubric.weight
        total += score
      }
    })
  }
  formData.value.score = Math.round(total * 100) / 100
}

// 监听评分变化，自动计算总分
const handleRubricScoreChange = () => {
  calculateTotalScore()
}

// 提交批改结果
const submitGrade = async () => {
  try {
    isSubmitting.value = true
    
    // 验证评分
    if (formData.value.score <= 0) {
      ElMessage.warning('请为学生评分')
      // Don't return, allow 0 score if intended, but warning is good. 
      // Actually, if score is 0, maybe it's not graded yet? 
      // Let's assume 0 is valid but warn.
    }
    
    await teacherApi.gradeSubmission(submissionId, formData.value)
    
    ElMessage.success('批改成功')
    
    // 返回上一页
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (err: any) {
    console.error('提交批改失败:', err)
    ElMessage.error(err.message || '提交批改失败')
  } finally {
    isSubmitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 判断附件类型
const isFileAttachment = (attachment: string) => {
  return attachment.trim().startsWith('http')
}

// 获取附件文件名
const getFileName = (url: string) => {
  const trimmed = url.trim()
  const match = trimmed.match(/[^/]+\.[^/]+$/)  
  return match ? match[0] : '附件'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchSubmission()
})
</script>

<template>
  <div class="grade-submission-container">
    <div class="header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="goBack" class="back-btn" />
        <div class="header-info">
          <h2>批改作业</h2>
          <p class="assignment-info">学生：{{ studentInfo.name }}</p>
        </div>
      </div>
    </div>

    <div class="content-container" v-loading="isLoading">
      <template v-if="submission && assignment">
        <!-- 信息概览部分 - 水平布局 -->
        <div class="overview-section">
          <!-- 作业信息卡片 -->
          <el-card class="overview-card assignment-overview" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>作业信息</span>
              </div>
            </template>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">作业标题：</span>
                <span class="info-value">{{ assignment.title }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">作业类型：</span>
                <el-tag type="primary" size="small">
                  {{ 
                    assignment.type === 'ASSIGNMENT' ? '作业' :
                    assignment.type === 'QUIZ' ? '测验' :
                    assignment.type === 'PROJECT' ? '项目' : assignment.type
                  }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">发布时间：</span>
                <span class="info-value">{{ formatDate(assignment.publishedAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">截至时间：</span>
                <span class="info-value deadline">{{ formatDate(assignment.deadline) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">允许重交：</span>
                <span class="info-value">{{ assignment.allowResubmit ? '是' : '否' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最大重交：</span>
                <span class="info-value">{{ assignment.maxResubmit }}</span>
              </div>
            </div>
          </el-card>

          <!-- 提交信息卡片 -->
          <el-card class="overview-card submission-overview" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>提交信息</span>
              </div>
            </template>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">提交时间：</span>
                <span class="info-value">{{ formatDate(submission.submittedAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">提交状态：</span>
                <el-tag 
                  size="small"
                  :type="
                    submission.status === 'GRADED' ? 'success' :
                    submission.status === 'RESUBMITTED' ? 'warning' :
                    submission.status === 'SUBMITTED' ? 'primary' : 'info'
                  "
                >
                  {{ 
                    submission.status === 'GRADED' ? '已批改' :
                    submission.status === 'RESUBMITTED' ? '已重交' :
                    submission.status === 'SUBMITTED' ? '已提交' : submission.status
                  }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">重交次数：</span>
                <span class="info-value">{{ submission.resubmitCount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">批改教师：</span>
                <span class="info-value">{{ submission.gradingTeacherId || '未批改' }}</span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 提交内容卡片 -->
        <el-card class="content-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>提交内容</span>
            </div>
          </template>
          <div v-if="submission.attachments.length === 0" class="empty-attachments">
            <el-empty description="暂无提交内容" :image-size="60" />
          </div>
          <div v-else class="attachments-list">
            <div 
              v-for="(attachment, index) in submission.attachments" 
              :key="index"
              class="attachment-item"
            >
              <div v-if="isFileAttachment(attachment)" class="file-attachment">
                <el-icon class="attachment-icon"><Document /></el-icon>
                <a :href="attachment.trim()" target="_blank" class="file-name">{{ getFileName(attachment) }}</a>
              </div>
              <div v-else class="text-attachment">
                <el-icon class="attachment-icon"><DocumentCopy /></el-icon>
                <div class="text-content">{{ attachment }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 评分卡片 -->
        <el-card class="grading-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>评分</span>
            </div>
          </template>
          <el-form label-position="top">
            <!-- 评分标准 -->
            <div v-if="assignment.gradingRubric.length > 0" class="rubric-section">
              <h4>评分标准</h4>
              <div class="rubric-items">
                <div 
                  v-for="(rubric, index) in assignment.gradingRubric" 
                  :key="index"
                  class="rubric-item"
                >
                  <div class="rubric-header">
                    <span class="criterion-name">{{ rubric.criterion }}</span>
                    <span class="weight-info">(权重: {{ (rubric.weight * 100).toFixed(0) }}%)</span>
                  </div>
                  <el-form-item :label="rubric.criterion + ' 得分'" v-if="formData.rubricScores[index]">
                    <el-input-number
                      v-model="formData.rubricScores[index].score"
                      @change="handleRubricScoreChange"
                      :min="0"
                      :max="100"
                      :step="1"
                      class="w-full"
                    />
                  </el-form-item>
                </div>
              </div>
            </div>

            <!-- 总评分 -->
            <el-form-item label="总评分">
              <el-input-number
                v-model="formData.score"
                :min="0"
                :max="100"
                :step="0.5"
                disabled
                class="w-full"
              />
            </el-form-item>

            <!-- 反馈信息 -->
            <el-form-item label="反馈信息">
              <el-input
                v-model="formData.feedback"
                type="textarea"
                :rows="4"
                placeholder="请输入反馈信息"
              />
            </el-form-item>

            <!-- 发布选项 -->
            <el-form-item>
              <el-switch
                v-model="formData.publish"
                active-text="立即发布成绩"
                inactive-text="暂不发布"
              />
            </el-form-item>

            <!-- 提交按钮 -->
            <el-form-item>
              <div class="form-actions">
                <el-button 
                  type="primary" 
                  size="large"
                  @click="submitGrade"
                  :loading="isSubmitting"
                >
                  提交批改
                </el-button>
                <el-button 
                  size="large"
                  @click="goBack"
                  :disabled="isSubmitting"
                >
                  取消
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </template>
    </div>
  </div>
</template>

<style scoped>
.grade-submission-container {
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

.assignment-info {
  margin: 5px 0 0 0;
  font-size: 1rem;
  color: #718096;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 水平布局的概览部分 */
.overview-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.overview-card {
  flex: 1;
  min-width: 300px;
}

.assignment-overview {
  border-left: 4px solid #409eff;
}

.submission-overview {
  border-left: 4px solid #67c23a;
}

.card-header {
  font-weight: 600;
  font-size: 1.1rem;
}

/* 网格布局的信息展示 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-weight: 600;
  color: #606266;
  font-size: 0.9rem;
}

.info-value {
  color: #303133;
  font-size: 1rem;
}

.deadline {
  color: #e6a23c;
  font-weight: 500;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attachment-item {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.file-attachment, .text-attachment {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.attachment-icon {
  color: #409eff;
  font-size: 20px;
  margin-top: 2px;
}

.file-name {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  word-break: break-all;
}

.file-name:hover {
  text-decoration: underline;
}

.text-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  color: #303133;
  line-height: 1.6;
}

.rubric-section {
  margin-bottom: 24px;
}

.rubric-section h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #303133;
  font-size: 1.1rem;
  font-weight: 600;
}

.rubric-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rubric-item {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.rubric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.criterion-name {
  font-weight: 600;
  color: #303133;
}

.weight-info {
  color: #909399;
  font-size: 0.9rem;
}

.w-full {
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 10px;
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
