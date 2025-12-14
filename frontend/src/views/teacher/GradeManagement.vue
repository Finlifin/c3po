<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'
import router from '../../router'
import TeacherSidebar from '../../components/TeacherSidebar.vue'
// 引入Element UI Plus组件
import { ElTable, ElTableColumn, ElButton, ElTag, ElLoading, ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

// 生成年份选择器的选项
const currentYear = new Date().getFullYear();
const years = ref(Array.from({ length: currentYear - 2020 + 6 }, (_, i) => (2020 + i).toString()));

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 课程数据类型定义
interface Course {
  id: string;
  name: string;
  semester: string;
  credit: number;
  enrollLimit: number;
  teacherId: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  metrics: { 
    enrolledCount: number;
    assignments: number;
    modules: number;
  };
}

// 成绩状态数据类型定义
interface GradeStatus {
  courseId: string;
  hasPublishedGrades: boolean;
  average?: number;
}

// 状态管理
const courses = ref<Course[]>([])
const isLoading = ref(true)
const error = ref('')
const gradeStatusMap = ref<Record<string, GradeStatus>>({})

// 获取教师信息
const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return null
    }
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    return response.data
  } catch (err: any) {
    console.error('获取用户信息失败:', err)
    return null
  }
}

// 获取课程成绩状态
const fetchCourseGradeStatus = async (courseId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/scores`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    // 只有当items不为空时，才表示已发布成绩
    if (response.data.success && response.data.data?.items && response.data.data.items.length > 0) {
      gradeStatusMap.value[courseId] = {
        courseId: response.data.data.courseId,
        hasPublishedGrades: true,
        average: response.data.data.overview?.average
      }
    } else {
      gradeStatusMap.value[courseId] = {
        courseId,
        hasPublishedGrades: false
      }
    }
  } catch (err: any) {
    // 如果API调用失败，默认认为成绩未公布
    gradeStatusMap.value[courseId] = {
      courseId,
      hasPublishedGrades: false
    }
    console.error(`获取课程${courseId}成绩状态失败:`, err)
  }
}

// 获取课程列表
const fetchCourses = async () => {
  try {
    isLoading.value = true
    const user = await getCurrentUser()
    if (!user?.id) {
      throw new Error('未获取到教师ID')
    }
    
    // 发送带teacherId参数的GET请求
    const response = await axios.get(`${API_BASE_URL}/courses`, {
      params: { 
        teacherId: user.id 
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    // 只保留已发布的课程
    courses.value = (response.data.data || []).filter(course => course.status === 'PUBLISHED')
    
    // 为每个课程获取成绩状态
    for (const course of courses.value) {
      await fetchCourseGradeStatus(course.id)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('获取课程列表失败:', err)
  } finally {
    isLoading.value = false
  }
}

// 进入查看成绩页面
const goToViewGrades = (courseId: string) => {
  ElMessage({
    message: '正在进入查看成绩页面',
    type: 'info',
    duration: 1000
  })
  router.push(`/teacher/courses/${courseId}/grades`)
}

// 进入发布成绩页面
const goToPublishGrades = (courseId: string) => {
  ElMessage({
    message: '正在进入发布成绩页面',
    type: 'info',
    duration: 1000
  })
  router.push(`/teacher/courses/${courseId}/grades/publish`)
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('expiresIn')
  router.push('/teacher')
}

// 获取课程状态文本
const getCourseStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'DRAFT': '草稿',
    'PENDING_REVIEW': '待审核',
    'PUBLISHED': '已发布'
  }
  return statusMap[status] || status
}

// 获取成绩状态文本
const getGradeStatusText = (hasPublishedGrades: boolean) => {
  return hasPublishedGrades ? '已公布成绩' : '待公布成绩'
}

// 页面加载时获取课程列表
onMounted(() => {
  fetchCourses()
})
</script>

<template>
  <div class="grade-management">
    <!-- 左侧固定菜单栏 -->
    <TeacherSidebar class="left-menu" activeMenu="grade-management" />

    <!-- 右侧主内容区 -->
    <div class="main-content">
      <div class="header">
        <h2>成绩管理</h2>
      </div>

      <!-- 课程列表 -->
      <div class="courses-container">
        <div v-if="isLoading" class="loading">加载中...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="courses.length === 0" class="empty-courses">
          <p>暂无课程，请先创建课程</p>
        </div>
        <el-table 
          v-else 
          :data="courses" 
          stripe 
          border 
          style="width: 100%"
          empty-text="暂无课程数据"
        >
          <el-table-column prop="name" label="课程名称" min-width="180" align="left">
            <template #default="{row}">
              <strong>{{ row.name }}</strong>
            </template>
          </el-table-column>
          
          <el-table-column prop="semester" label="学期" min-width="120"></el-table-column>
          
          <el-table-column prop="credit" label="学分" width="80"></el-table-column>
          
          <el-table-column label="选课情况" min-width="150">
            <template #default="{row}">
              <span>{{ row.metrics?.enrolledCount || 0 }}/{{ row.enrollLimit }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="作业数" width="100">
            <template #default="{row}">
              <span>{{ row.metrics?.assignments || 0 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="成绩状态" min-width="120">
            <template #default="{row}">
              <el-tag 
                :type="gradeStatusMap[row.id]?.hasPublishedGrades ? 'success' : 'primary'" 
                size="small"
              >
                {{ getGradeStatusText(gradeStatusMap[row.id]?.hasPublishedGrades || false) }}
              </el-tag>
              <div v-if="gradeStatusMap[row.id]?.hasPublishedGrades" class="average-score">
                平均分: {{ gradeStatusMap[row.id]?.average?.toFixed(1) || 0 }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" min-width="160" fixed="right">
            <template #default="{row}">
              <el-button 
                v-if="gradeStatusMap[row.id]?.hasPublishedGrades" 
                type="primary" 
                size="small" 
                @click="goToViewGrades(row.id)"
              >
                查看成绩
              </el-button>
              <el-button 
                v-else 
                type="success" 
                size="small" 
                @click="goToPublishGrades(row.id)"
              >
                发布成绩
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-management {
  display: flex;
  height: 100vh;
  overflow: hidden;
  overflow-x: hidden;
  background-color: #f5f7fa;
}
.left-menu {
  width: 260px;       /* 固定宽度 */
  flex-shrink: 0;     /* 不允许缩小 */
}


/* 右侧主内容区 */
.main-content {
  margin-left: 100px;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
}

/* 响应式设计 */
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

/* 课程列表 */
.courses-container {
  padding: 30px;
  flex: 1;
  background-color: #f5f7fa;
}

.loading, .empty-courses, .error-message {
  text-align: center;
  padding: 60px 0;
  font-size: 1.2rem;
  color: #666;
}

.loading {
  color: #667eea;
}

.error-message {
  color: #ef4444;
  background-color: #fee2e2;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-table__header) {
  background-color: #f8fafc;
  font-weight: 600;
}

:deep(.el-table__row:hover) {
  background-color: #f0f9ff;
}

.average-score {
  font-size: 0.9rem;
  color: #065f46;
  margin-top: 4px;
  font-weight: 500;
}

.courses-container {
  overflow-x: auto;
}

/* 确保表格在小屏幕上也能正常显示 */
@media (max-width: 768px) {
  :deep(.el-table) {
    font-size: 0.9rem;
  }
  
  :deep(.el-button) {
    padding: 4px 8px;
    font-size: 0.8rem;
  }
}
</style>