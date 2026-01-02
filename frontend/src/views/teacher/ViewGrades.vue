<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'

// 路由参数
const route = useRoute()
const router = useRouter()
const courseId = route.params.courseId as string

// 成绩数据类型定义
interface ScoreItem {
  id: string
  studentId: string
  courseId: string
  component: string
  value: number
}

interface ScoreDistribution {
  label: string
  from: number
  to: number
  count: number
}

interface ScoreData {
  courseId: string
  items: ScoreItem[]
  overview: {
    average: number
    median: number
    highest: number
    lowest: number
    scoreCount: number
    studentCount: number
    completionRate: number
  }
  distribution: ScoreDistribution[]
  componentAverages: Record<string, number>
  topPerformers: string[]
  needsAttention: string[]
}

// 状态管理
const scoreData = ref<ScoreData | null>(null)
const isLoading = ref(true)

// 获取成绩数据
const fetchScores = async () => {
  try {
    isLoading.value = true
    const response = await teacherApi.getCourseScores(courseId)

    if (response.data.success) {
      scoreData.value = response.data.data
    } else {
      throw new Error('获取成绩失败')
    }
  } catch (err: any) {
    console.error('获取成绩失败:', err)
    ElMessage.error(err.message || '获取成绩失败')
  } finally {
    isLoading.value = false
  }
}

// 获取分数标签类型
const getScoreTagType = (score: number): string => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 70) return 'warning'
  if (score >= 60) return 'info'
  return 'danger'
}

// 返回成绩管理
const goBack = () => {
  router.push('/teacher/grade-management')
}

// 页面加载时获取成绩数据
onMounted(() => {
  fetchScores()
})
</script>

<template>
  <div class="view-grades-container">
    <div class="header">
      <div class="header-left">
        <h2>查看成绩</h2>
        <el-button type="primary" plain @click="goBack" class="back-btn">
          返回成绩管理
        </el-button>
      </div>
    </div>

    <!-- 成绩概览 -->
    <div class="overview-section">
      <h3>成绩概览</h3>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="overview-card">
            <template #header>
              <div class="card-header">
                <span>总体均分</span>
              </div>
            </template>
            <el-statistic
              :value="scoreData?.overview.average || 0"
              :precision="1"
              suffix="分"
              value-style="color: #3f8600"
            />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="overview-card">
            <template #header>
              <div class="card-header">
                <span>最高分</span>
              </div>
            </template>
            <el-statistic
              :value="scoreData?.overview.highest || 0"
              suffix="分"
              value-style="color: #cf1322"
            />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="overview-card">
            <template #header>
              <div class="card-header">
                <span>最低分</span>
              </div>
            </template>
            <el-statistic
              :value="scoreData?.overview.lowest || 0"
              suffix="分"
              value-style="color: #1890ff"
            />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="overview-card">
            <template #header>
              <div class="card-header">
                <span>覆盖学生数</span>
              </div>
            </template>
            <el-statistic
              :value="scoreData?.overview.studentCount || 0"
              suffix="人"
              value-style="color: #722ed1"
            />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card shadow="hover" class="overview-card">
            <template #header>
              <div class="card-header">
                <span>完成率</span>
              </div>
            </template>
            <div class="completion-rate">
              <el-progress
                :percentage="Math.round((scoreData?.overview.completionRate || 0) * 100)"
                :format="(percentage: number) => `${percentage}%`"
                type="dashboard"
                :width="100"
              />
              <div class="completion-text">
                <el-statistic
                  :value="Math.round((scoreData?.overview.completionRate || 0) * 100)"
                  suffix="%"
                  value-style="color: #eb2f96; font-size: 1.5rem;"
                />
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" class="overview-card">
            <template #header>
              <div class="card-header">
                <span>中位数</span>
              </div>
            </template>
            <el-statistic
              :value="scoreData?.overview.median || 0"
              :precision="1"
              suffix="分"
              value-style="color: #fa8c16"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 成绩分布 -->
    <div class="distribution-section" v-if="scoreData?.distribution">
      <h3>成绩分布</h3>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card shadow="hover">
            <div class="distribution-container">
              <div
                v-for="(item, index) in scoreData.distribution"
                :key="index"
                class="distribution-item"
              >
                <div class="distribution-label">{{ item.label }}</div>
                <div class="distribution-bar">
                  <div
                    class="distribution-progress"
                    :style="{
                      width: `${(item.count / Math.max(...scoreData.distribution.map(d => d.count)) * 100) || 0}%`
                    }"
                    :class="`progress-${index}`"
                  ></div>
                </div>
                <div class="distribution-count">{{ item.count }}人</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 成绩列表 -->
    <div class="scores-section">
      <h3>成绩详情</h3>
      <el-card shadow="hover">
        <el-skeleton :loading="isLoading" animated>
          <template #template>
            <div class="skeleton-item" v-for="i in 5" :key="i">
              <div class="skeleton-row"></div>
            </div>
          </template>
          <el-table
            v-if="scoreData?.items && scoreData.items.length > 0"
            :data="scoreData.items"
            style="width: 40%"
            stripe
            border
            class="scores-table"
          >
            <el-table-column prop="studentId" label="学生ID" width="200" />
            <el-table-column prop="component" label="成绩构成" width="200" />
            <el-table-column
              prop="value"
              label="分数"
              width="150"
            >
              <template #default="scope">
                <el-tag
                  :type="getScoreTagType(scope.row.value)"
                  size="small"
                >
                  {{ scope.row.value }}分
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无成绩数据" />
        </el-skeleton>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.view-grades-container {
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

/* 概览部分 */
.overview-section,
.distribution-section,
.scores-section {
  margin-bottom: 30px;
}

.overview-section h3,
.distribution-section h3,
.scores-section h3 {
  margin-bottom: 20px;
  font-size: 1.4rem;
  color: #2d3748;
  font-weight: 600;
}

.overview-card {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-header {
  margin-top: 14px;
  justify-content: center;
  font-weight: 400;
  color: #718096;
}

.completion-rate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.completion-text {
  text-align: center;
}

/* 成绩分布 */
.distribution-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.distribution-label {
  width: 80px;
  text-align: right;
  font-weight: 600;
  color: #2d3748;
}

.distribution-bar {
  flex: 1;
  height: 20px;
  background-color: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}

.distribution-progress {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-0 { background-color: #ff4d4f; }
.progress-1 { background-color: #faad14; }
.progress-2 { background-color: #a0d911; }
.progress-3 { background-color: #13c2c2; }
.progress-4 { background-color: #1890ff; }

.distribution-count {
  width: 60px;
  text-align: left;
  font-weight: 600;
  color: #595959;
}

/* 成绩表格 */
.scores-table {
  
  margin-top: 20px;
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
