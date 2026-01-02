<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { teacherApi } from '../../api/teacher'
import { studentApi } from '../../api/student'
import { ElMessage } from 'element-plus'
import { User, Reading } from '@element-plus/icons-vue'
import PageContainer from '../../components/layout/PageContainer.vue'
import StatsGrid from '../../components/layout/StatsGrid.vue'
import ContentGrid from '../../components/layout/ContentGrid.vue'
import TodoList from '../../components/common/TodoList.vue'

const router = useRouter()
const authStore = useAuthStore()

// User data
const user = computed(() => authStore.user)

// Course data
interface Course {
  id: string;
  name: string;
  semester: string;
  credit: number;
  enrollLimit: number;
  teacherId: string;
  metrics: {
    enrolledCount: number;
    modules: number;
  };
}

const courses = ref<Course[]>([])
const isLoadingCourses = ref(true)
const totalCourses = ref(0)

// Todo data
const todos = ref<any[]>([])
const isLoadingTodos = ref(false)

// Fetch courses
const fetchCourses = async () => {
  try {
    isLoadingCourses.value = true
    
    // 确保获取用户信息
    if (!user.value?.id) {
      await authStore.fetchUserInfo()
    }
    
    if (!user.value?.id) {
      throw new Error('未获取到教师ID')
    }
    
    // 传递教师ID以过滤课程
    const response = await teacherApi.getCourses(user.value.id)
    
    courses.value = response.data.data || []
    totalCourses.value = response.data.meta?.total || courses.value.length
  } catch (err: any) {
    console.error('获取课程列表失败:', err)
    ElMessage.error(err.response?.data?.message || '获取课程列表失败')
  } finally {
    isLoadingCourses.value = false
  }
}

// Fetch todos
const fetchTodos = async () => {
  try {
    isLoadingTodos.value = true
    // Assuming teachers also have todos or notifications
    const response = await studentApi.getTodos() 
    todos.value = response.data.data || []
  } catch (err: any) {
    console.error('获取待办事项失败:', err)
  } finally {
    isLoadingTodos.value = false
  }
}

// 进入课程资源页面
const goToCourseResources = (courseId: string) => {
  router.push(`/teacher/courses/${courseId}`)
}

// 进入发布作业页面
const goToPublishAssignment = (courseId: string) => {
  router.push(`/teacher/courses/${courseId}/assignments/new`)
}

// Load user info and courses on mount
onMounted(async () => {
  // 先获取用户信息，确保有用户ID
  if (!user.value?.id) {
    await authStore.fetchUserInfo()
  }
  // fetchCourses 内部也会检查用户ID，但这里先获取可以避免重复请求
  await Promise.all([fetchCourses(), fetchTodos()])
})
</script>

<template>
  <PageContainer>
    <!-- Welcome Section -->
    <div class="welcome-section">
      <h2>欢迎回来，{{ user?.username }}老师！</h2>
      <p>这是您的教师仪表板，您可以在这里管理课程、学生和作业。</p>
    </div>

    <!-- 统计卡片 -->
    <StatsGrid>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalCourses }}</div>
          <div class="stat-label">开课数</div>
        </div>
      </el-card>
    </StatsGrid>

    <!-- 我的课程 -->
    <div class="section-container">
      <h3>我的课程</h3>
      <div v-loading="isLoadingCourses">
        <el-empty v-if="!isLoadingCourses && courses.length === 0" description="暂无课程" />
        <ContentGrid v-else min-width="300px" gap="md" :columns="{ xs: 1, sm: 1, md: 2, lg: 3 }">
          <el-card 
            v-for="course in courses" 
            :key="course.id"
            class="course-card"
            shadow="hover"
            :body-style="{ padding: '0px' }"
          >
            <div class="course-header">
              <h4>{{ course.name }}</h4>
              <span class="semester">{{ course.semester }}</span>
            </div>
            <div class="course-stats">
              <div class="stat-item">
                <el-icon class="stat-icon"><User /></el-icon>
                <span class="stat-value">{{ course.metrics?.enrolledCount || 0 }}</span>
                <span class="stat-text">学生数</span>
              </div>
              <div class="stat-item">
                <el-icon class="stat-icon"><Reading /></el-icon>
                <span class="stat-value">{{course.metrics?.modules || 0}}</span>
                <span class="stat-text">章节数</span>
              </div>
            </div>
            <div class="course-actions">
              <el-button type="primary" class="action-btn" @click="goToCourseResources(course.id)">管理课程</el-button>
              <el-button class="action-btn" @click="goToPublishAssignment(course.id)">布置作业</el-button>
            </div>
          </el-card>
        </ContentGrid>
      </div>
    </div>

    <!-- 我的待办事项 -->
    <TodoList
      title="我的待办事项"
      :todos="todos"
      :loading="isLoadingTodos"
      @todo-click="(todo) => router.push(`/teacher/assignments/${todo.id}/submissions`)"
    />
  </PageContainer>
</template>

<style scoped>
.welcome-section {
  background-color: var(--bg-primary);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-8);
}

.welcome-section h2 {
  color: var(--text-primary);
  font-size: 1.8rem;
  margin-bottom: var(--space-2);
  margin-top: 0;
}

.welcome-section p {
  color: var(--text-secondary);
  font-size: var(--text-base);
  margin: 0;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: var(--space-4);
}

.stat-number {
  font-size: 2rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: var(--space-2);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.section-container {
  margin-bottom: var(--space-8);
}

.section-container h3 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.course-card {
  transition: all var(--transition-base);
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.course-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  padding: var(--space-5);
}

.course-header h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
}

.semester {
  font-size: var(--text-sm);
  opacity: 0.9;
  color: #fff;
}

.course-stats {
  display: flex;
  justify-content: space-between;
  padding: var(--space-5);
  background-color: var(--bg-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat-icon {
  font-size: 1.2rem;
  color: var(--primary);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.course-actions {
  padding: var(--space-4);
  display: flex;
  gap: var(--space-2);
}

.action-btn {
  flex: 1;
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-md);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .welcome-section {
    padding: var(--space-5);
  }

  .welcome-section h2 {
    font-size: 1.5rem;
  }

  .welcome-section p {
    font-size: var(--text-sm);
  }

  .section-container h3 {
    font-size: 1.25rem;
  }

  .stat-number {
    font-size: 1.75rem;
  }

  .course-header h4 {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: var(--space-4);
  }

  .welcome-section h2 {
    font-size: 1.25rem;
  }

  .section-container h3 {
    font-size: 1.125rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .course-header h4 {
    font-size: 1rem;
  }
}
</style>
