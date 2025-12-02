<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/layout/MainLayout.vue'
import { dashboardAPI } from '../services/api.js'
import { mockAPI } from '../services/mockData.js'
// 导入ECharts组件和配置
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 使用必要的组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

const router = useRouter()
const useMock = false // 临时对接后端接口，必要时切换为true以使用mock数据
const loading = ref(true)
const error = ref('')

// 统计卡片数据
const statistics = ref([])

// 最近活动数据
const recentActivities = ref([])

// 待处理任务数据
const pendingTasks = ref([])

// 格式化数字显示
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 从API获取仪表盘数据
const fetchDashboardData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (useMock) {
      const dashboardStatsApi = mockAPI.getDashboardStats
      const recentActivitiesApi = mockAPI.getRecentActivities
      const pendingTasksApi = mockAPI.getPendingTasks
      const [statsResponse, activitiesResponse, tasksResponse] = await Promise.all([
        dashboardStatsApi(),
        recentActivitiesApi(),
        pendingTasksApi()
      ])
      applyMockStats(statsResponse)
      applyMockActivities(activitiesResponse)
      applyMockTasks(tasksResponse)
    } else {
      // 调用管理员指标接口
      const response = await dashboardAPI.getDashboardStats()
      // 后端返回的是 ApiResponse 格式，http 拦截器已返回 response.data
      // 如果 response 有 data 字段，说明是 ApiResponse 格式，否则直接使用 response
      const metricsData = response?.data || response || {}
      console.log('获取到的仪表盘数据:', metricsData)
      applyAdminMetricsData(metricsData)
    }
  } catch (err) {
    console.error('获取仪表盘数据失败:', err)
    error.value = '获取数据失败，请稍后重试'
    
    // 设置默认数据以保证UI正常显示
    setDefaultData()
  } finally {
    loading.value = false
  }
}

// 设置默认数据
const setDefaultData = () => {
  statistics.value = [
    { label: '总用户数', value: '0', class: 'users' },
    { label: '教师数量', value: '0', class: 'teachers' },
    { label: '课程总数', value: '0', class: 'courses' },
    { label: '活跃用户', value: '0', class: 'active' }
  ]
  
  recentActivities.value = [
    { icon: 'system', title: '暂无数据', time: '请稍后刷新' }
  ]
  
  pendingTasks.value = [
    { icon: '📝', title: '暂无待处理任务', info: '', actionText: '刷新', actionClass: 'btn-secondary', type: 'refresh' }
  ]
}

// 格式化时间显示
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`
  } else {
    return `${diffInDays}天前`
  }
}

// 获取活动图标
const getActivityIcon = (iconType) => {
  const iconMap = {
    user: '👤',
    course: '📚',
    system: '⚙️'
  }
  return iconMap[iconType] || '📝'
}

// 模态框状态
const showModal = ref(false)
const currentTask = ref(null)

// 处理任务
const handleTask = (task) => {
  currentTask.value = task
  showModal.value = true
}

// 关闭模态框
const closeModal = () => {
  showModal.value = false
  currentTask.value = null
}

// 获取任务类型的详细内容
const getTaskModalContent = (task) => {
  const contentMap = {
    'user-review': {
      title: '用户审核',
      description: '当前有 12 个新用户等待审核，请前往用户管理页面进行审核操作。',
      confirmText: '前往审核',
      cancelText: '稍后处理'
    },
    'course-review': {
      title: '课程审核',
      description: '当前有 5 门课程等待审核，请前往课程审核页面进行审核操作。',
      confirmText: '前往审核',
      cancelText: '稍后处理'
    },
    'system-alert': {
      title: '系统告警',
      description: '检测到 3 个系统告警需要处理，请及时查看并处理相关问题。',
      confirmText: '查看详情',
      cancelText: '稍后查看'
    },
    'data-backup': {
      title: '数据备份',
      description: '本周数据备份任务，建议立即执行备份操作以确保数据安全。',
      confirmText: '立即备份',
      cancelText: '稍后备份'
    },
    'approval': {
      title: '审批待办',
      description: '存在待审批的入会或课程申请，请尽快处理。',
      confirmText: '前往审批',
      cancelText: '稍后处理'
    }
  }
  return contentMap[task.type] || {
    title: task.title,
    description: task.info,
    confirmText: '确认',
    cancelText: '取消'
  }
}

// 确认处理任务
const confirmTask = () => {
  if (currentTask.value) {
    // 根据任务类型执行不同的操作
    switch (currentTask.value.type) {
      case 'user-review':
      case 'member':
        // 跳转到用户管理页面
        closeModal()
        router.push('/admin/users')
        break
      case 'course-review':
      case 'course':
        // 跳转到课程管理页面
        closeModal()
        router.push('/admin/courses')
        break
      case 'approval':
        // 跳转到课程管理页面
        closeModal()
        router.push('/admin/courses')
        break
      case 'system-alert':
      case 'report':
        // 实际项目中这里会跳转到系统告警页面
        alert('正在查看系统告警详情...')
        closeModal()
        break
      case 'data-backup':
        // 实际项目中这里会执行备份操作
        alert('正在执行数据备份...')
        closeModal()
        break
      case 'refresh':
        // 刷新数据
        closeModal()
        fetchDashboardData()
        break
      default:
        alert(`正在处理：${currentTask.value.title}`)
        closeModal()
    }
  }
}

// 平台使用统计图表数据
const platformUsageData = ref({
  title: {
    text: '平台使用率趋势（最近7天）',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'normal'
    }
  },
  tooltip: {
    trigger: 'axis',
    formatter: function(params) {
      let result = params[0].name + '<br/>';
      params.forEach(item => {
        result += item.marker + item.seriesName + ': ' + item.value + '%<br/>';
      });
      return result;
    }
  },
  legend: {
    data: ['活跃用户', '课程访问', '作业提交'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}%'
    },
    max: 100
  },
  series: [
    {
      name: '活跃用户',
      type: 'line',
      stack: 'Total',
      data: [65, 72, 78, 73, 79, 85, 82],
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#007aff'
      },
      areaStyle: {
        opacity: 0.2
      },
      smooth: true
    },
    {
      name: '课程访问',
      type: 'line',
      stack: 'Total',
      data: [52, 60, 68, 59, 65, 75, 70],
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#34c759'
      },
      areaStyle: {
        opacity: 0.2
      },
      smooth: true
    },
    {
      name: '作业提交',
      type: 'line',
      stack: 'Total',
      data: [40, 45, 42, 38, 48, 52, 49],
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#ff9500'
      },
      areaStyle: {
        opacity: 0.2
      },
      smooth: true
    }
  ]
})

// 数字动画效果
const animateNumbers = () => {
  if (loading.value) return
  
  const statNumbers = document.querySelectorAll('.stat-number')
  statNumbers.forEach(stat => {
    const finalValue = stat.textContent
    stat.textContent = '0'
    
    setTimeout(() => {
      let current = 0
      const targetValue = parseInt(finalValue.replace(',', ''))
      const increment = targetValue / 50
      const timer = setInterval(() => {
        current += increment
        if (current >= targetValue) {
          stat.textContent = finalValue
          clearInterval(timer)
        } else {
          stat.textContent = Math.floor(current).toLocaleString()
        }
      }, 30)
    }, 500)
  })
}

// 组件挂载时获取数据
onMounted(async () => {
  await fetchDashboardData()
  animateNumbers()
})

const applyMockStats = (statsResponse) => {
  statistics.value = [
    {
      label: '总用户数',
      value: formatNumber(statsResponse.totalMembers || 0),
      class: 'users'
    },
    {
      label: '教师数量',
      value: formatNumber(statsResponse.totalTeachers || 0),
      class: 'teachers'
    },
    {
      label: '课程总数',
      value: formatNumber(statsResponse.totalCourses || 0),
      class: 'courses'
    },
    {
      label: '活跃用户',
      value: formatNumber(statsResponse.activeUsers || 0),
      class: 'active'
    }
  ]
}

const applyMockActivities = (activitiesResponse) => {
  recentActivities.value = (activitiesResponse || []).map(activity => {
    let iconType = 'system'
    if (activity.type === 'activity') iconType = 'course'
    if (activity.type === 'achievement' || activity.type === 'member') iconType = 'user'

    return {
      icon: iconType,
      title: activity.title,
      time: `${activity.title} • ${formatTimeAgo(activity.date)}`
    }
  })
}

const applyMockTasks = (tasksResponse) => {
  pendingTasks.value = (tasksResponse || []).map(task => {
    let icon = '📝'
    let actionClass = 'btn-primary'

    if (task.type === 'member' || task.type === 'user-review') {
      icon = '📋'
      actionClass = 'btn-primary'
    } else if (task.type === 'course' || task.type === 'course-review') {
      icon = '📚'
      actionClass = 'btn-primary'
    } else if (task.type === 'report' || task.type === 'system-alert') {
      icon = '⚠️'
      actionClass = 'btn-warning'
    } else if (task.type === 'data-backup') {
      icon = '📊'
      actionClass = 'btn-secondary'
    }

    return {
      ...task,
      icon,
      actionText: '处理',
      actionClass
    }
  })
}

// 应用管理员指标数据
const applyAdminMetricsData = (metrics) => {
  const {
    totalUsers = 0,
    totalCourses = 0,
    activeCourses = 0,
    totalAssignments = 0,
    pendingApprovals = 0
  } = metrics

  // 更新统计卡片数据
  statistics.value = [
    { label: '总用户数', value: formatNumber(totalUsers), class: 'users' },
    { label: '课程总数', value: formatNumber(totalCourses), class: 'courses' },
    { label: '活跃课程', value: formatNumber(activeCourses), class: 'active' },
    { label: '作业总数', value: formatNumber(totalAssignments), class: 'teachers' }
  ]

  // 更新最近活动数据
  recentActivities.value = [
    {
      icon: 'user',
      title: '用户总数',
      time: `平台共有 ${totalUsers} 名注册用户`
    },
    {
      icon: 'course',
      title: '课程管理',
      time: `共 ${totalCourses} 门课程，其中 ${activeCourses} 门已发布`
    },
    {
      icon: 'system',
      title: '作业统计',
      time: `平台共有 ${totalAssignments} 个作业任务`
    }
  ]

  // 更新待处理任务数据
  pendingTasks.value = []
  
  if (pendingApprovals > 0) {
    pendingTasks.value.push({
      id: 'pending-approvals',
      icon: '📋',
      title: '待审批事项',
      info: `共有 ${pendingApprovals} 项待审批`,
      actionText: '前往审批',
      actionClass: 'btn-primary',
      type: 'approval'
    })
  }
  
  if (totalCourses > 0) {
    pendingTasks.value.push({
      id: 'course-management',
      icon: '📚',
      title: '课程管理',
      info: `共 ${totalCourses} 门课程，${activeCourses} 门已发布`,
      actionText: '查看课程',
      actionClass: 'btn-secondary',
      type: 'course'
    })
  }
  
  if (totalAssignments > 0) {
    pendingTasks.value.push({
      id: 'assignment-overview',
      icon: '📝',
      title: '作业总览',
      info: `平台共有 ${totalAssignments} 个作业任务`,
      actionText: '查看详情',
      actionClass: 'btn-secondary',
      type: 'course'
    })
  }
  
  // 如果没有待处理任务，显示默认提示
  if (pendingTasks.value.length === 0) {
    pendingTasks.value.push({
      id: 'no-tasks',
      icon: '✅',
      title: '暂无待处理任务',
      info: '所有事项已完成',
      actionText: '刷新',
      actionClass: 'btn-secondary',
      type: 'refresh'
    })
  }
}

const formatPercent = (value) => {
  const percent = (Number(value) || 0) * 100
  return `${percent.toFixed(1)}%`
}
</script>

<template>
  <MainLayout>
    <main class="main-content">
      <header class="header">
        <div class="header-content">
          <h1 class="welcome-text">系统管理后台</h1>
          <div class="user-info">
            <div class="user-avatar">管</div>
            <span>系统管理员</span>
          </div>
        </div>
      </header>
      
      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button class="btn btn-sm btn-primary" @click="fetchDashboardData">重试</button>
      </div>

      <div class="stats-grid">
        <div 
          v-for="(stat, index) in statistics" 
          :key="index"
          class="stat-card"
          style="position: relative;"
        >
          <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
          <div class="stat-number" :class="stat.class">{{ loading ? '加载中...' : stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <div class="overview-grid">
        <div class="recent-activities" style="position: relative;">
          <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
          <h3 class="section-title">最近活动</h3>
          <div v-if="loading" class="loading-placeholder">加载中...</div>
          <div v-else
            v-for="(activity, index) in recentActivities" 
            :key="index"
            class="activity-item"
          >
            <div class="activity-icon" :class="activity.icon">
              {{ getActivityIcon(activity.icon) }}
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">{{ activity.time }}</div>
            </div>
          </div>
        </div>

        <div class="pending-tasks" style="position: relative;">
          <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
          <h3 class="section-title">待处理任务</h3>
          <div v-if="loading" class="loading-placeholder">加载中...</div>
          <div v-else
            v-for="(task, index) in pendingTasks" 
            :key="index"
            class="task-item"
          >
            <div class="task-icon">{{ task.icon }}</div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-info">{{ task.info }}</div>
            </div>
            <div class="task-actions">
              <button 
                class="btn btn-sm" 
                :class="task.actionClass"
                @click="handleTask(task)"
              >
                {{ task.actionText }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container" style="position: relative;">
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
        <h3 class="chart-title">平台使用统计</h3>
        <div v-if="loading" class="loading-placeholder" style="text-align: center; padding: 40px; height: 300px; display: flex; align-items: center; justify-content: center;">加载中...</div>
        <v-chart v-else class="chart-content" :option="platformUsageData" autoresize />
      </div>
    </main>

    <!-- 任务处理模态框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title" v-if="currentTask">{{ getTaskModalContent(currentTask).title }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="currentTask">
          <div class="task-modal-info">
            <div class="task-modal-icon">{{ currentTask.icon }}</div>
            <div class="task-modal-details">
              <h4>{{ currentTask.title }}</h4>
              <p>{{ currentTask.info }}</p>
            </div>
          </div>
          <div class="task-modal-description">
            <p>{{ getTaskModalContent(currentTask).description }}</p>
          </div>
        </div>
        <div class="modal-footer" v-if="currentTask">
          <button class="btn btn-secondary" @click="closeModal">
            {{ getTaskModalContent(currentTask).cancelText }}
          </button>
          <button 
            class="btn" 
            :class="currentTask.actionClass"
            @click="confirmTask"
          >
            {{ getTaskModalContent(currentTask).confirmText }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.main-content {
  padding: 24px;
  min-height: 100vh;
}

.header {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ff3b30;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-number.users {
  color: #007aff;
}

.stat-number.teachers {
  color: #5856d6;
}

.stat-number.courses {
  color: #34c759;
}

.stat-number.active {
  color: #ff9500;
}

.stat-label {
  color: #86868b;
  font-size: 14px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 24px;
}

.overview-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.recent-activities {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #d1d1d6;
  gap: 16px;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.activity-icon.user {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.activity-icon.course {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.activity-icon.system {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 14px;
  color: #86868b;
}

.pending-tasks {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #d1d1d6;
  gap: 16px;
}

.task-item:last-child {
  border-bottom: none;
}

.task-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff3b30;
  font-size: 18px;
}

.task-content {
  flex: 1;
}

.task-title {
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.task-info {
  font-size: 14px;
  color: #86868b;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.chart-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 32px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 24px;
  text-align: center;
}

.chart-content {
  height: 300px;
  width: 100%;
  border-radius: 12px;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
  min-height: 32px;
}

.btn-primary {
  background-color: #007aff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056cc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background-color: #ffffff;
  color: #1d1d1f;
  border: 1px solid #d1d1d6;
}

.btn-secondary:hover {
  background-color: #f2f2f7;
  transform: translateY(-1px);
}

.btn-warning {
  background-color: #ff9500;
  color: white;
}

.btn-warning:hover {
  background-color: #e08a00;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 16px;
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #d1d1d6;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #86868b;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-close:hover {
  background-color: #f2f2f7;
  color: #1d1d1f;
}

.modal-body {
  padding: 24px;
}

.task-modal-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.task-modal-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff3b30;
  font-size: 24px;
}

.task-modal-details h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 8px 0;
}

.task-modal-details p {
  font-size: 14px;
  color: #86868b;
  margin: 0;
}

.task-modal-description {
  padding: 16px;
  background: #f2f2f7;
  border-radius: 8px;
}

.task-modal-description p {
  margin: 0;
  color: #1d1d1f;
  font-size: 14px;
}

/* 错误消息样式 */
.error-message {
  background-color: #ffebee;
  color: #c62828;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ffcdd2;
}

/* 加载状态样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #d1d1d6;
}
</style>
