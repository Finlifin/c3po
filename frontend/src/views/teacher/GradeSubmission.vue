<script setup lang="ts">
console.log('GradeSubmission.vue页面加载中...')
import axios from 'axios'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElButton, ElMessage, ElMessageBox, ElTag, ElUpload, ElCard, ElDivider, ElSwitch, ElLoading } from 'element-plus'
import TeacherSidebar from '../../components/TeacherSidebar.vue'

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 路由参数
const route = useRoute()
const router = useRouter()
const submissionId = route.params.submissionId as string

// 状态管理
const submission = ref<any>(null)
const assignment = ref<any>(null)
const studentInfo = ref({ name: '' })
const isLoading = ref(true)
const error = ref('')
const isSubmitting = ref(false)

// 评分表单数据
const formData = ref({
  score: 0,
  rubricScores: [] as Array<{ criterion: string; score: number }>,
  feedback: '',
  publish: true
})

// 类型定义
interface Submission {
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

// 获取提交记录详情
const fetchSubmission = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/submissions/${submissionId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    submission.value = response.data.data
    
    // 获取学生信息
    await fetchStudentInfo(submission.value.studentId)
    // 获取作业信息
    await fetchAssignment(submission.value.assignmentId)
  } catch (err: any) {
    console.error('获取提交记录失败:', err)
    error.value = '获取提交记录失败'
  } finally {
    isLoading.value = false
  }
}

// 获取作业信息
const fetchAssignment = async (assignmentId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assignments/${assignmentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    assignment.value = response.data.data
    
    // 初始化评分标准
    initRubricScores()
  } catch (err: any) {
    console.error('获取作业信息失败:', err)
    error.value = '获取作业信息失败'
  }
}

// 由于没有学生信息API，使用默认学生信息
const fetchStudentInfo = async (studentId: string) => {
  try {
    // 直接设置学生信息，使用studentId作为标识
    studentInfo.value = { name: `学生${studentId.substring(0, 8)}` }
    console.log('使用默认学生信息:', studentInfo.value.name)
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
      ElMessage.error('请为学生评分')
      return
    }
    
    const response = await axios.post(`${API_BASE_URL}/submissions/${submissionId}/grade`, formData.value, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    ElMessage.success('批改成功')
    
    // 返回上一页
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (err: any) {
    console.error('提交批改失败:', err)
    ElMessage.error(err.response?.data?.message || '提交批改失败')
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
  return new Date(dateString).toLocaleString()
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    console.log('GradeSubmission.vue onMounted执行')
    console.log('当前提交ID:', submissionId)
    
    // 页面加载时获取提交记录数据
    await fetchSubmission()
    
    console.log('数据加载完成')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  }
})
</script>

<template>
  <div class="grade-submission">
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
            <h2>批改作业</h2>
            <p class="assignment-info">学生：{{ studentInfo.name }}</p>
          </div>
        </div>
      </div>

      <div class="content-container">
        <el-loading :visible="isLoading" text="加载中..." />
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <template v-else-if="submission && assignment">
          <!-- 信息概览部分 - 水平布局 -->
          <div class="overview-section">
            <!-- 作业信息卡片 -->
            <el-card class="overview-card assignment-overview" shadow="hover">
              <h3 class="card-title">作业信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">作业标题：</span>
                  <span class="info-value">{{ assignment.title }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">作业类型：</span>
                  <el-tag type="primary">
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
                  <span class="info-label">是否允许重交：</span>
                  <span class="info-value">{{ assignment.allowResubmit ? '是' : '否' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">最大重交次数：</span>
                  <span class="info-value">{{ assignment.maxResubmit }}</span>
                </div>
              </div>
            </el-card>

            <!-- 提交信息卡片 -->
            <el-card class="overview-card submission-overview" shadow="hover">
              <h3 class="card-title">提交信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">提交时间：</span>
                  <span class="info-value">{{ formatDate(submission.submittedAt) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">提交状态：</span>
                  <el-tag 
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
            <h3>提交内容</h3>
            <div v-if="submission.attachments.length === 0" class="empty-attachments">
              <p>暂无提交内容</p>
            </div>
            <div v-else class="attachments-list">
              <div 
                v-for="(attachment, index) in submission.attachments" 
                :key="index"
                class="attachment-item"
              >
                <div v-if="isFileAttachment(attachment)" class="file-attachment">
                  <i class="el-icon-document"></i>
                  <a :href="attachment.trim()" target="_blank" class="file-name">{{ getFileName(attachment) }}</a>
                </div>
                <div v-else class="text-attachment">
                  <i class="el-icon-document-text"></i>
                  <div class="text-content">{{ attachment }}</div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 评分卡片 -->
          <el-card class="grading-card" shadow="hover">
            <h3>评分</h3>
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
                    <el-form-item :label="rubric.criterion + ' 得分'">
                      <el-input-number
                        v-model="formData.rubricScores[index].score"
                        @change="handleRubricScoreChange"
                        :min="0"
                        :max="100"
                        :step="1"
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
              </el-form-item>
            </el-form>
          </el-card>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-submission {
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

.assignment-info {
  margin: 5px 0 0 0;
  font-size: 1rem;
  opacity: 0.9;
}

.content-container {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

/* 水平布局的概览部分 */
.overview-section {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-section {
    flex-direction: column;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .header {
    padding: 15px 20px;
  }
  
  .header h2 {
    font-size: 1.5rem;
  }
  
  .content-container {
    padding: 20px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.overview-card {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
}

.assignment-overview {
  border-left: 4px solid #667eea;
}

.submission-overview {
  border-left: 4px solid #764ba2;
}

.card-title {
  margin-top: 0;
  margin-bottom: 16px;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

/* 网格布局的信息展示 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.info-value {
  color: #6b7280;
  font-size: 1rem;
}

.deadline {
  color: #f97316;
  font-weight: 500;
}

/* 原有卡片样式保留 */
.content-card, .grading-card {
  border-radius: 12px;
  overflow: hidden;
}

.info-label {
  font-weight: 600;
  color: #374151;
  min-width: 80px;
}

.info-value {
  color: #6b7280;
}

.content-card h3, .grading-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
}

.empty-attachments {
  text-align: center;
  padding: 40px 0;
  color: #6b7280;
  font-style: italic;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attachment-item {
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.file-attachment, .text-attachment {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.file-attachment i, .text-attachment i {
  color: #4f46e5;
  font-size: 20px;
  margin-top: 2px;
}

.file-name {
  color: #4f46e5;
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
  color: #374151;
  line-height: 1.6;
}

.rubric-section {
  margin-bottom: 24px;
}

.rubric-section h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #374151;
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
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.rubric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.criterion-name {
  font-weight: 600;
  color: #374151;
}

.weight-info {
  color: #6b7280;
  font-size: 0.9rem;
}

.el-form-item__label {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}
</style>