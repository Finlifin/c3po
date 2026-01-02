<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElCard, ElTable, ElTableColumn, ElTag, ElProgress, ElEmpty, ElSkeleton } from 'element-plus'
import { useStudentAuthStore } from '../../stores/auth_student'
import { studentApi } from '../../api/student'
import PageContainer from '../../components/layout/PageContainer.vue'
import ContentGrid from '../../components/layout/ContentGrid.vue'

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
const authStore = useStudentAuthStore()
const user = computed(() => authStore.user)
const isLoading = ref(true)
const error = ref('')
const scoreData = ref<ScoreData | null>(null)

// 获取成绩数据
const fetchScores = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    // 确保获取用户信息
    if (!user.value?.id) {
      await authStore.fetchUserInfo()
    }
    
    if (!user.value?.id) {
      throw new Error('未获取到学生ID')
    }
    
    // 使用统一的API调用获取成绩
    const response = await studentApi.getScores(user.value.id)
    
    // 处理响应数据（根据API文档，响应格式为 ApiResponse）
    if (response.data.success) {
      scoreData.value = response.data.data
    } else {
      throw new Error(response.data.error?.message || '获取成绩失败')
    }
  } catch (err: any) {
    console.error('获取成绩失败:', err)
    error.value = err.response?.data?.message || err.message || '获取成绩失败'
    ElMessage.error(error.value)
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
  // 先确保有用户信息
  if (!user.value?.id) {
    await authStore.fetchUserInfo()
  }
  await fetchScores()
})
</script>

<template>
  <PageContainer>
    <div class="page-header">
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
              <!-- 桌面端：表格视图 -->
              <div class="trend-table-view">
                <el-table
                  :data="scoreData.trend"
                  stripe
                  border
                  style="width: 100%;"
                >
                  <el-table-column prop="courseName" label="课程名称" min-width="200" />
                  <el-table-column prop="component" label="成绩构成" min-width="180" />
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
                  <el-table-column prop="timestamp" label="时间" min-width="200" :formatter="(row) => new Date(row.timestamp).toLocaleString()" />
                </el-table>
              </div>
              
              <!-- 移动端：卡片视图 -->
              <div class="trend-card-view">
                <ContentGrid min-width="280px" gap="md" :columns="{ xs: 1, sm: 1, md: 2 }">
                  <el-card
                    v-for="(item, index) in scoreData.trend"
                    :key="index"
                    class="trend-card"
                    shadow="hover"
                  >
                    <div class="trend-card-header">
                      <h4 class="trend-course-name">{{ item.courseName }}</h4>
                      <el-tag
                        :type="getScoreTagType(item.value)"
                        size="small"
                      >
                        {{ item.value }}分
                      </el-tag>
                    </div>
                    <div class="trend-card-info">
                      <div class="trend-info-row">
                        <span class="trend-label">成绩构成：</span>
                        <span class="trend-value">{{ item.component }}</span>
                      </div>
                      <div class="trend-info-row">
                        <span class="trend-label">时间：</span>
                        <span class="trend-value">{{ new Date(item.timestamp).toLocaleString() }}</span>
                      </div>
                    </div>
                  </el-card>
                </ContentGrid>
              </div>
            </div>
            <div v-else class="empty-trend">
              <el-empty description="暂无学习趋势数据" />
            </div>
          </el-card>
        </div>
        
        <!-- 课程成绩明细 -->
        <div class="courses-section">
          <h3>课程成绩明细</h3>
          <ContentGrid min-width="350px" gap="md" :columns="{ xs: 1, sm: 1, md: 2 }">
            <el-card
              v-for="course in scoreData?.summary.courses"
              :key="course.courseId"
              class="course-item"
              shadow="hover"
            >
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
          </ContentGrid>
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
  </PageContainer>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--space-8);
}

.page-header h2 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--text-primary);
  font-weight: 700;
}

/* 综合概览样式 */
.summary-section {
  margin-bottom: var(--space-8);
}

.summary-section h3 {
  margin-bottom: var(--space-5);
  font-size: 1.5rem;
  color: var(--text-primary);
  font-weight: 600;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--grid-gap);
}

.summary-card {
  transition: all var(--transition-base);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-content {
  text-align: center;
}

.card-title {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.card-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

/* 学习趋势样式 */
.trend-section {
  margin-bottom: var(--space-8);
}

.trend-section h3 {
  margin-bottom: var(--space-5);
  font-size: 1.5rem;
  color: var(--text-primary);
  font-weight: 600;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.empty-trend {
  padding: var(--space-10) 0;
  text-align: center;
}

/* 桌面端表格视图 */
.trend-table-view {
  display: block;
}

/* 移动端卡片视图 */
.trend-card-view {
  display: none;
}

.trend-content {
  width: 100%;
}

.trend-card {
  transition: all var(--transition-base);
}

.trend-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.trend-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  gap: var(--space-2);
}

.trend-course-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.trend-card-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.trend-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.trend-label {
  color: var(--text-secondary);
}

.trend-value {
  color: var(--text-primary);
  font-weight: 500;
}

/* 课程成绩样式 */
.courses-section {
  margin-bottom: var(--space-8);
}

.courses-section h3 {
  margin-bottom: var(--space-5);
  font-size: 1.5rem;
  color: var(--text-primary);
  font-weight: 600;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.course-item {
  transition: all var(--transition-base);
}

.course-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.course-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.course-stats {
  display: flex;
  gap: var(--space-8);
  margin: var(--space-4) 0;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--gray-200);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}



.course-progress {
  margin-top: var(--space-5);
}

.course-progress h4 {
  margin-bottom: var(--space-4);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.progress-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.progress-item {
  margin-bottom: var(--space-2);
}

.progress-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  display: block;
  margin-bottom: var(--space-1);
}

.progress-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  display: block;
  margin-top: var(--space-1);
}

/* 学习建议样式 */
.insights-section {
  margin-bottom: var(--space-8);
}

.insights-section h3 {
  margin-bottom: var(--space-5);
  font-size: 1.5rem;
  color: var(--text-primary);
  font-weight: 600;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.insight-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
}

.empty-insights {
  padding: var(--space-10) 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .trend-table-view {
    display: none;
  }
  
  .trend-card-view {
    display: block;
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 1.5rem;
  }
  
  .summary-section h3,
  .trend-section h3,
  .courses-section h3,
  .insights-section h3 {
    font-size: 1.25rem;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .course-stats {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .course-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .summary-section,
  .trend-section,
  .courses-section,
  .insights-section {
    margin-bottom: var(--space-6);
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 1.25rem;
  }
  
  .summary-section h3,
  .trend-section h3,
  .courses-section h3,
  .insights-section h3 {
    font-size: 1.125rem;
  }
  
  .card-value {
    font-size: 1.75rem;
  }
  
  .trend-course-name {
    font-size: 1rem;
  }
  
  .course-name {
    font-size: 1.1rem;
  }
  
  .course-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 骨架屏样式 */
:deep(.el-skeleton__item) {
  margin-bottom: 20px;
}
</style>