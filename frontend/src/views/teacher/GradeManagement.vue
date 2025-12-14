<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

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

// 获取课程成绩状态
const fetchCourseGradeStatus = async (courseId: string) => {
  try {
    const response = await teacherApi.getCourseScores(courseId)
    
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
    if (!authStore.user?.id) {
      await authStore.fetchUserInfo()
    }
    
    if (!authStore.user?.id) {
      throw new Error('未获取到教师ID')
    }
    
    const response = await teacherApi.getCourses(authStore.user.id)
    
    // 只保留已发布的课程
    courses.value = (response.data.data || []).filter((course: Course) => course.status === 'PUBLISHED')
    
    // 为每个课程获取成绩状态
    for (const course of courses.value) {
      await fetchCourseGradeStatus(course.id)
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('获取课程列表失败:', err)
    ElMessage.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// 进入查看成绩页面
const goToViewGrades = (courseId: string) => {
  router.push(`/teacher/courses/${courseId}/grades`)
}

// 进入发布成绩页面
const goToPublishGrades = (courseId: string) => {
  router.push(`/teacher/courses/${courseId}/grades/publish`)
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
    <div class="content">
      <div class="header">
        <h2>成绩管理</h2>
      </div>

      <!-- 课程列表 -->
      <div class="courses-container">
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="courses.length === 0" class="empty-courses">
          <p>暂无已发布的课程</p>
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
  width: 100%;
  min-height: 100%;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.courses-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.loading, .empty-courses, .error-message {
  text-align: center;
  padding: 60px 0;
  font-size: 1.2rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #ff4d4f;
  background-color: #fee2e2;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
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
</style>
