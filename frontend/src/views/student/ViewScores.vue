<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { ElMessage, ElCard, ElTable, ElTableColumn, ElTag, ElProgress, ElEmpty, ElSkeleton } from 'element-plus'
import StudentSidebar from '../../components/StudentSidebar.vue'

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 学生ID
const studentId = ref<string>('') // 实际项目中应从登录状态获取

// 数据类型定义
interface ScoreItem {
  id: string
  studentId: string
  courseId: string
  component: string
  value: number
  releasedAt: string
  createdAt: string
  updatedAt: string
}

interface CourseSummary {
  courseId: string
  courseName: string
  average: number
  highest: number
  lowest: number
  scoreCount: number
  componentAverages: Record<string, number>
  progress: {
    totalAssignments: number
    completedAssignments: number
    gradedAssignments: number
    overdueAssignments: number
  }
}

interface Progress {
  totalCourses: number
  totalAssignments: number
  completedAssignments: number
  gradedAssignments: number
  overdueAssignments: number
}

interface TrendItem {
  courseName: string
  component: string
  value: number
  timestamp: string
}

interface ExportInfo {
  available: boolean
  suggestedJobType: string
  suggestedParams: {
    studentId: string
    courseIds: string[]
  }
  instructions: string
}

interface ScoreData {
  studentId: string
  items: ScoreItem[]
  summary: {
    overallAverage: number
    median: number
    gpa: number
    progress: Progress
    courses: CourseSummary[]
    insights: string[]
  }
  trend: TrendItem[]
  exportInfo: ExportInfo
}

// 状态管理
const isLoading = ref(true)
const error = ref('')
const scoreData = ref<ScoreData | null>(null)

// 用户信息
const userInfo = ref<any>(null)

// 获取成绩数据
const fetchScores = async () => {
  try {
    isLoading.value = true
    
    // 先获取用户信息
    const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('Stoken')}`
      }
    })
    
    if (userResponse.data.success) {
      userInfo.value = userResponse.data.data
      studentId.value = userResponse.data.data.id
      
      // 使用获取到的学生ID获取成绩
      const scoresResponse = await axios.get(`${API_BASE_URL}/students/${studentId.value}/scores`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('Stoken')}`
        }
      })
      
      if (scoresResponse.data.success) {
        scoreData.value = scoresResponse.data.data
      } else {
        throw new Error('获取成绩失败')
      }
    } else {
      throw new Error('获取用户信息失败')
    }
  } catch (err: any) {
    console.error('获取成绩失败:', err)
    error.value = err.message || '获取成绩失败'
    ElMessage.error('获取成绩失败')
  } finally {
    isLoading.value = false
  }
}

// 获取分数标签类型
const getScoreTagType = (score: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 70) return 'warning'
  if (score >= 60) return 'info'
  return 'danger'
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchScores()
})
</script>

<template>
  <div class="view-scores">
    <!-- 左侧固定菜单栏 -->
    <StudentSidebar class="left-menu" activeMenu="scores" />

    <!-- 右侧主内容区 -->
    <div class="main-content">
      <div class="header">
        <h2>我的成绩</h2>
      </div>

      <!-- 加载状态 -->
      <el-skeleton v-if="isLoading" animated :rows="10" :columns="{ cols: 4, gutter: 16 }" />
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <el-empty description="获取成绩失败，请稍后重试" />
      </div>
      
      <!-- 成绩内容 -->
      <div v-else>
        <!-- 综合概览卡片 -->
        <div class="summary-section">
          <h3>综合概览</h3>
          <div class="summary-cards">
            <el-card shadow="hover" class="summary-card">
              <div class="card-content">
                <div class="card-title">整体平均分</div>
                <div class="card-value">{{ scoreData?.summary.overallAverage.toFixed(1) || 0 }}</div>
                <div class="card-desc">所有课程的平均成绩</div>
              </div>
            </el-card>
            
            <el-card shadow="hover" class="summary-card">
              <div class="card-content">
                <div class="card-title">GPA</div>
                <div class="card-value">{{ scoreData?.summary.gpa.toFixed(2) || 0 }}</div>
                <div class="card-desc">平均学分绩点</div>
              </div>
            </el-card>
            
            <el-card shadow="hover" class="summary-card">
              <div class="card-content">
                <div class="card-title">已修课程</div>
                <div class="card-value">{{ scoreData?.summary.progress.totalCourses || 0 }}</div>
                <div class="card-desc">总课程数量</div>
              </div>
            </el-card>
            
            <el-card shadow="hover" class="summary-card">
              <div class="card-content">
                <div class="card-title">作业完成率</div>
                <div class="card-value">{{ Math.round(((scoreData?.summary.progress.completedAssignments || 0) / (scoreData?.summary.progress.totalAssignments || 1)) * 100) }}%</div>
                <el-progress 
                  :percentage="Math.round(((scoreData?.summary.progress.completedAssignments || 0) / (scoreData?.summary.progress.totalAssignments || 1)) * 100)" 
                  :stroke-width="8" 
                  :show-text="false"
                  style="margin-top: 10px;"
                />
              </div>
            </el-card>
          </div>
        </div>
        
        <!-- 学习趋势 -->
        <div class="trend-section">
          <h3>各课程成绩</h3>
          <el-card shadow="hover">
            <div v-if="scoreData?.trend && scoreData.trend.length > 0" class="trend-content">
              <el-table
                :data="scoreData.trend"
                stripe
                border
                style="width: 100%;"
              >
                <el-table-column prop="courseName" label="课程名称" width="200" />
                <el-table-column prop="component" label="成绩构成" width="180" />
                <el-table-column prop="value" label="分数" width="120">
                  <template #default="scope">
                    <el-tag
                      :type="getScoreTagType(scope.row.value)"
                      size="small"
                    >
                      {{ scope.row.value }}分
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="timestamp" label="时间" width="200" :formatter="(row) => new Date(row.timestamp).toLocaleString()" />
              </el-table>
            </div>
            <div v-else class="empty-trend">
              <el-empty description="暂无学习趋势数据" />
            </div>
          </el-card>
        </div>
        
        <!-- 课程成绩明细 -->
        <div class="courses-section">
          <h3>课程成绩明细</h3>
          <div v-for="course in scoreData?.summary.courses" :key="course.courseId" class="course-item">
            <el-card shadow="hover">
              <template #header>
                <div class="course-header">
                  <span class="course-name">{{ course.courseName }}</span>
                  <el-tag :type="getScoreTagType(course.average)" size="small">
                    分数: {{ course.average }}分
                  </el-tag>
                </div>
              </template>
              
              <div class="course-stats">
                <div class="stat-item">
                  <span class="stat-label">最高分</span>
                  <span class="stat-value">{{ course.highest }}分</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最低分</span>
                  <span class="stat-value">{{ course.lowest }}分</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">成绩数量</span>
                  <span class="stat-value">{{ course.scoreCount }}项</span>
                </div>
              </div>
              

              
              <div class="course-progress" style="margin-top: 20px;">
                <h4>学习进度</h4>
                <div class="progress-items">
                  <div class="progress-item">
                    <span class="progress-label">已完成作业</span>
                    <el-progress 
                      :percentage="Math.round((course.progress.completedAssignments / (course.progress.totalAssignments || 1)) * 100)" 
                      :stroke-width="10" 
                      :show-text="true"
                      style="margin-top: 5px;"
                    />
                    <span class="progress-desc">{{ course.progress.completedAssignments }}/{{ course.progress.totalAssignments }} 项</span>
                  </div>
                  <div class="progress-item">
                    <span class="progress-label">已批改作业</span>
                    <el-progress 
                      :percentage="Math.round((course.progress.gradedAssignments / (course.progress.totalAssignments || 1)) * 100)" 
                      :stroke-width="10" 
                      :show-text="true"
                      style="margin-top: 5px;"
                    />
                    <span class="progress-desc">{{ course.progress.gradedAssignments }}/{{ course.progress.totalAssignments }} 项</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
        
        <!-- 学习建议 -->
        <div class="insights-section">
          <h3>学习建议</h3>
          <el-card shadow="hover">
            <div v-if="scoreData?.summary.insights && scoreData.summary.insights.length > 0" class="insights-list">
              <div v-for="(insight, index) in scoreData.summary.insights" :key="index" class="insight-item">
                <el-tag type="info" size="small" style="margin-right: 10px;">建议</el-tag>
                <span>{{ insight }}</span>
              </div>
            </div>
            <div v-else class="empty-insights">
              <el-empty description="暂无学习建议" />
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>


.left-menu {
  width: 260px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  background-color: #eaecf0;
  padding: 20px;
  margin-left: 260px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #2d3748;
  font-weight: 700;
}

/* 综合概览样式 */
.summary-section {
  margin-bottom: 30px;
}

.summary-section h3 {
  margin-bottom: 20px;
  font-size: 1.4rem;
  color: #2d3748;
  font-weight: 600;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.summary-card {
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  text-align: center;
}

.card-title {
  font-size: 1rem;
  color: #718096;
  margin-bottom: 10px;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 5px;
}

.card-desc {
  font-size: 0.85rem;
  color: #a0aec0;
}

/* 学习趋势样式 */
.trend-section {
  margin-bottom: 30px;
}

.trend-section h3 {
  margin-bottom: 20px;
  font-size: 1.4rem;
  color: #2d3748;
  font-weight: 600;
}

.empty-trend {
  padding: 40px 0;
  text-align: center;
}

/* 课程成绩样式 */
.courses-section {
  margin-bottom: 30px;
}

.courses-section h3 {
  margin-bottom: 20px;
  font-size: 1.4rem;
  color: #2d3748;
  font-weight: 600;
}

.course-item {
  margin-bottom: 20px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
}

.course-stats {
  display: flex;
  gap: 30px;
  margin: 15px 0;
  padding: 15px 0;
  border-bottom: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
}



.course-progress {
  margin-top: 20px;
}

.course-progress h4 {
  margin-bottom: 15px;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.progress-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.progress-item {
  margin-bottom: 10px;
}

.progress-label {
  font-size: 0.9rem;
  color: #718096;
  display: block;
  margin-bottom: 5px;
}

.progress-desc {
  font-size: 0.85rem;
  color: #a0aec0;
  display: block;
  margin-top: 5px;
}

/* 学习建议样式 */
.insights-section {
  margin-bottom: 30px;
}

.insights-section h3 {
  margin-bottom: 20px;
  font-size: 1.4rem;
  color: #2d3748;
  font-weight: 600;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.insight-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.empty-insights {
  padding: 40px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
    padding: 10px;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .course-stats {
    flex-direction: column;
    gap: 15px;
  }
}

/* 骨架屏样式 */
:deep(.el-skeleton__item) {
  margin-bottom: 20px;
}
</style>