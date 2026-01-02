<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, Close } from '@element-plus/icons-vue'

// 路由参数
const route = useRoute()
const router = useRouter()
const assignmentId = route.params.assignmentId as string

// 状态管理
const submissions = ref<any[]>([])
const isLoading = ref(true)
const submitting = ref(false)
const assignmentInfo = ref({
  title: '',
  courseName: '',
  totalScore: 100 // 默认总分100，实际应从API获取
})

// 评分标准
const rubricCriteria = ref<any[]>([])

// 获取作业基本信息
const fetchAssignmentInfo = async () => {
  try {
    const response = await teacherApi.getAssignment(assignmentId)
    assignmentInfo.value.title = response.data.data.title
    assignmentInfo.value.totalScore = response.data.data.totalScore || 100
    
    // 获取课程信息
    const courseResponse = await teacherApi.getCourse(response.data.data.courseId)
    assignmentInfo.value.courseName = courseResponse.data.data.name
    
    // 从API获取评分标准
    if (response.data.data.gradingRubric) {
      rubricCriteria.value = response.data.data.gradingRubric.map((rubric: any) => ({
        criterion: rubric.criterion,
        weight: rubric.weight,
        maxScore: Math.round(assignmentInfo.value.totalScore * rubric.weight)
      }))
    } else {
      // 默认评分标准
      rubricCriteria.value = [
        { criterion: '正确性', weight: 0.5, maxScore: 50 },
        { criterion: '代码规范', weight: 0.3, maxScore: 30 },
        { criterion: '创新性', weight: 0.2, maxScore: 20 }
      ]
    }
  } catch (err: any) {
    console.error('获取作业信息失败:', err)
    ElMessage.error('获取作业信息失败')
  }
}

// 获取提交记录
const fetchSubmissions = async () => {
  try {
    const response = await teacherApi.getAssignmentSubmissions(assignmentId)
    const data = response.data.data || []
    
    // 为每个提交添加评分相关的状态
    submissions.value = data.map((submission: any) => ({
      ...submission,
      studentName: getStudentName(submission.studentId),
      score: submission.score || '',
      rubricScores: rubricCriteria.value.map(c => ({
        criterion: c.criterion,
        score: submission.rubricScores?.find((rs: any) => rs.criterion === c.criterion)?.score || ''
      })),
      feedback: submission.feedback || '',
      publish: true
    }))
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

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 计算总分（根据权重）
const calculateTotalScore = (submission: any) => {
  if (!submission.rubricScores || submission.rubricScores.length === 0) {
    return ''
  }
  
  let total = 0
  submission.rubricScores.forEach((rs: any, index: number) => {
    const score = Number(rs.score) || 0
    total += score
  })
  
  return total
}

// 更新总分
const updateTotalScore = (submission: any) => {
  submission.score = calculateTotalScore(submission)
}

// 批量提交评分
const submitBatchGrades = async () => {
  try {
    submitting.value = true
    
    // 准备请求数据
    const grades = submissions.value.map(submission => ({
      submissionId: submission.id,
      score: Number(submission.score),
      rubricScores: submission.rubricScores.map((rs: any) => ({
        criterion: rs.criterion,
        score: Number(rs.score)
      })),
      feedback: submission.feedback,
      publish: submission.publish
    })).filter(item => item.score > 0 || item.feedback.trim())
    
    if (grades.length === 0) {
      ElMessage.warning('请至少为一个学生评分')
      return
    }
    
    // 调用API
    await teacherApi.batchGradeSubmissions(assignmentId, { grades })
    
    ElMessage.success('批量评分成功')
    router.back()
  } catch (err: any) {
    console.error('批量评分失败:', err)
    ElMessage.error(err.message || '批量评分失败')
  } finally {
    submitting.value = false
  }
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchAssignmentInfo()
  await fetchSubmissions()
})
</script>

<template>
  <div class="batch-grade-container">
    <div class="header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="goBack" class="back-btn" />
        <div class="header-info">
          <h2>批量批改</h2>
          <p class="assignment-name">课程：{{ assignmentInfo.courseName }} | 作业：{{ assignmentInfo.title }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          :loading="submitting"
          @click="submitBatchGrades"
        >
          提交评分
        </el-button>
      </div>
    </div>

    <!-- 批量批改表格 -->
    <div class="batch-grade-content">
      <el-card shadow="hover">
        <div v-if="isLoading" class="loading">加载中...</div>
        <div v-else>
          <table class="custom-table">
            <thead>
              <tr>
                <th>学生姓名</th>
                <th>状态</th>
                <th>提交时间</th>
                <th>重交次数</th>
                <th>附件</th>
                <th>总分</th>
                <th>
                  <div v-for="criterion in rubricCriteria" :key="criterion.criterion">
                    {{ criterion.criterion }} ({{ criterion.maxScore }})
                  </div>
                </th>
                <th>评语</th>
                <th>发布</th>
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
                <td>{{ formatDate(item.submittedAt) }}</td>
                <td>{{ item.resubmitCount }}</td>
                <td>
                  <div class="attachments-list">
                    <div v-for="(attachment, index) in (item.attachments || [])" :key="index">
                      <a 
                        v-if="attachment.startsWith('http')" 
                        :href="attachment" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="attachment-link"
                      >
                        附件{{ index + 1 }}
                      </a>
                      <span v-else class="attachment-text">
                        {{ attachment }}
                      </span>
                    </div>
                    <div v-if="!(item.attachments && item.attachments.length)" class="no-attachments">
                      无附件
                    </div>
                  </div>
                </td>
                <td>
                  <el-input-number
                    v-model="item.score"
                    :min="0"
                    :max="assignmentInfo.totalScore"
                    :precision="0"
                    size="small"
                  />
                </td>
                <td>
                  <div v-for="(rs, index) in item.rubricScores" :key="index">
                    <el-input-number
                      v-model="rs.score"
                      :min="0"
                      :max="rubricCriteria[index].maxScore"
                      :precision="0"
                      size="small"
                      @change="updateTotalScore(item)"
                    />
                  </div>
                </td>
                <td>
                  <el-input
                    v-model="item.feedback"
                    type="textarea"
                    size="small"
                    :rows="2"
                  />
                </td>
                <td>
                  <el-switch
                    v-model="item.publish"
                    :active-icon="Check"
                    :inactive-icon="Close"
                    size="small"
                  />
                </td>
              </tr>
              <tr v-if="submissions.length === 0">
                <td colspan="10" class="empty-row">暂无学生提交记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.batch-grade-container {
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

.batch-grade-content {
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

.empty-row {
  text-align: center;
  color: #909399;
  font-style: italic;
}

/* 附件样式 */
.attachments-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.attachment-link {
  color: #409eff;
  text-decoration: underline;
  cursor: pointer;
}

.attachment-text {
  color: #606266;
}

.no-attachments {
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

/* 输入框样式 */
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  height: 24px;
}

:deep(.el-input-number__input) {
  height: 24px;
  line-height: 24px;
}

:deep(.el-textarea__inner) {
  min-height: 60px;
  max-height: 100px;
}
</style>