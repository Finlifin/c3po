<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'
import PageContainer from '../../components/layout/PageContainer.vue'
import ContentGrid from '../../components/layout/ContentGrid.vue'

const router = useRouter()
const authStore = useAuthStore()

// 生成年份选择器的选项
const currentYear = new Date().getFullYear();
const years = ref(Array.from({ length: currentYear - 2020 + 6 }, (_, i) => (2020 + i).toString()));

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

// 状态管理
const courses = ref<Course[]>([])
const isLoading = ref(true)
const error = ref('')

// 创建课程弹窗状态
const isCreateModalVisible = ref(false)
const createCourseForm = ref({
  name: '',
  year: new Date().getFullYear().toString(),
  season: '春',
  credit: 0,
  enrollLimit: 0
})

// 编辑课程弹窗状态
const isEditModalVisible = ref(false)
const editCourseForm = ref({
  id: '',
  name: '',
  year: '',
  season: '',
  credit: 0,
  enrollLimit: 0
})

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
    courses.value = response.data.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('获取课程列表失败:', err)
    ElMessage.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// 创建课程
const createCourse = async () => {
  try {
    if (!authStore.user?.id) {
      throw new Error('未获取到教师ID')
    }
    
    // 将year和season组合成semester字段
    const semester = `${createCourseForm.value.year}${createCourseForm.value.season}`
    
    const requestData = {
      name: createCourseForm.value.name,
      semester: semester,
      credit: createCourseForm.value.credit,
      enrollLimit: createCourseForm.value.enrollLimit,
      teacherId: authStore.user.id
    }
    
    await teacherApi.createCourse(requestData)
    
    // 关闭弹窗并刷新课程列表
    isCreateModalVisible.value = false
    fetchCourses()
    ElMessage.success('创建课程成功')
    
    // 重置表单
    createCourseForm.value = {
      name: '',
      year: new Date().getFullYear().toString(),
      season: '春',
      credit: 0,
      enrollLimit: 0
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || '创建课程失败'
    console.error('创建课程失败:', err)
    ElMessage.error(msg)
  }
}

// 更新课程
const updateCourse = async () => {
  try {
    const courseId = editCourseForm.value.id
    
    // 构造只包含非空字段的请求数据
    const requestData: any = {}
    if (editCourseForm.value.name !== '') requestData.name = editCourseForm.value.name
    if (editCourseForm.value.year !== '' && editCourseForm.value.season !== '') requestData.semester = `${editCourseForm.value.year}${editCourseForm.value.season}`
    if (editCourseForm.value.credit !== null && editCourseForm.value.credit !== undefined) requestData.credit = editCourseForm.value.credit
    if (editCourseForm.value.enrollLimit !== null && editCourseForm.value.enrollLimit !== undefined) requestData.enrollLimit = editCourseForm.value.enrollLimit
    
    await teacherApi.updateCourse(courseId, requestData)
    
    // 关闭弹窗并刷新课程列表
    isEditModalVisible.value = false
    fetchCourses()
    ElMessage.success('更新课程成功')
  } catch (err: any) {
    const msg = err.response?.data?.message || '更新课程失败'
    console.error('更新课程失败:', err)
    ElMessage.error(msg)
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

// 进入作业管理页面
const goToAssignmentManagement = (courseId: string) => {
  router.push(`/teacher/courses/${courseId}/assignments`)
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

// 打开编辑课程弹窗
const openEditModal = (course: Course) => {
  // 解析学期为年份和季节，例如：2025春 -> year: "2025", season: "春"
  const year = course.semester.slice(0, 4)
  const season = course.semester.slice(4)
  
  editCourseForm.value = {
    id: course.id,
    name: course.name,
    year: year,
    season: season,
    credit: course.credit,
    enrollLimit: course.enrollLimit
  }
  isEditModalVisible.value = true
}

// 页面加载时获取课程列表
onMounted(() => {
  fetchCourses()
})
</script>

<template>
  <PageContainer>
    <div class="header">
      <h2>课程管理</h2>
      <button class="create-course-btn" @click="isCreateModalVisible = true">
        <span class="btn-icon">+</span>
        创建课程
      </button>
    </div>

    <!-- 课程列表 -->
    <div class="courses-container">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="courses.length === 0" class="empty-courses">
        <div class="empty-icon">📚</div>
        <p>暂无课程，请点击右上角"创建课程"按钮添加课程</p>
      </div>
      <ContentGrid v-else min-width="320px" gap="md" :columns="{ xs: 1, sm: 1, md: 2, lg: 3 }">
        <el-card
          v-for="course in courses"
          :key="course.id"
          class="course-card"
          shadow="hover"
          @click="goToCourseResources(course.id)"
        >
            <div class="course-header">
              <h3 class="course-name">{{ course.name }}</h3>
              <span 
                class="course-status" 
                :class="{
                  'status-draft': course.status === 'DRAFT',
                  'status-pending': course.status === 'PENDING_REVIEW',
                  'status-published': course.status === 'PUBLISHED'
                }"
              >
                {{ getCourseStatusText(course.status) }}
              </span>
            </div>
            <div class="course-info">
              <div class="info-item">
                <span class="info-label">学期:</span>
                <span class="info-value">{{ course.semester }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">学分:</span>
                <span class="info-value">{{ course.credit }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">限选人数:</span>
                <span class="info-value">{{ course.enrollLimit }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">已选人数:</span>
                <span class="info-value">{{ course.metrics?.enrolledCount || 0 }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">
                  <span class="icon">📝</span> 作业数:
                </span>
                <span class="info-value">{{ course.metrics?.assignments || 0 }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">
                  <span class="icon">📚</span> 章节数:
                </span>
                <span class="info-value">{{ course.metrics?.modules || 0 }}</span>
              </div>
            </div>
            <div class="course-actions">
              <button class="action-btn" @click.stop="goToPublishAssignment(course.id)">发布作业</button>
              <button class="action-btn" @click.stop="goToCourseResources(course.id)">管理资源</button>
              <button class="action-btn" @click.stop="goToAssignmentManagement(course.id)">查看作业</button>
              <button class="action-btn edit-btn" @click.stop="openEditModal(course)">编辑</button>
            </div>
          </el-card>
      </ContentGrid>
    </div>

    <!-- 创建课程弹窗 -->
    <el-dialog
      v-model="isCreateModalVisible"
      title="创建新课程"
      width="500px"
      destroy-on-close
    >
      <el-form :model="createCourseForm" label-width="80px">
        <el-form-item label="课程名称" required>
          <el-input v-model="createCourseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="学期" required>
          <div class="semester-selector">
            <el-select v-model="createCourseForm.year" placeholder="年份" style="width: 120px; margin-right: 10px;">
              <el-option v-for="year in years" :key="year" :label="year" :value="year" />
            </el-select>
            <el-select v-model="createCourseForm.season" placeholder="季节" style="width: 100px;">
              <el-option label="春" value="春" />
              <el-option label="秋" value="秋" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="学分" required>
          <el-input-number v-model="createCourseForm.credit" :min="0" :step="0.5" />
        </el-form-item>
        <el-form-item label="限选人数" required>
          <el-input-number v-model="createCourseForm.enrollLimit" :min="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isCreateModalVisible = false">取消</el-button>
          <el-button type="primary" @click="createCourse">创建课程</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑课程弹窗 -->
    <el-dialog
      v-model="isEditModalVisible"
      title="编辑课程"
      width="500px"
      destroy-on-close
    >
      <el-form :model="editCourseForm" label-width="80px">
        <el-form-item label="课程名称">
          <el-input v-model="editCourseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="学期">
          <div class="semester-selector">
            <el-select v-model="editCourseForm.year" placeholder="年份" style="width: 120px; margin-right: 10px;">
              <el-option v-for="year in years" :key="year" :label="year" :value="year" />
            </el-select>
            <el-select v-model="editCourseForm.season" placeholder="季节" style="width: 100px;">
              <el-option label="春" value="春" />
              <el-option label="秋" value="秋" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="学分">
          <el-input-number v-model="editCourseForm.credit" :min="0" :step="0.5" />
        </el-form-item>
        <el-form-item label="限选人数">
          <el-input-number v-model="editCourseForm.enrollLimit" :min="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isEditModalVisible = false">取消</el-button>
          <el-button type="primary" @click="updateCourse">保存修改</el-button>
        </span>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
}

.header h2 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin: 0;
}

.create-course-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  border: none;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.create-course-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-icon {
  font-size: 18px;
  font-weight: bold;
}

.courses-container {
  min-height: 400px;
}

.loading, .error-message, .empty-courses {
  text-align: center;
  padding: var(--space-16) var(--space-5);
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  margin: 0 auto var(--space-5);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: var(--error);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-5);
}

.empty-courses p {
  color: var(--text-secondary);
  margin-bottom: var(--space-5);
}

.course-card {
  cursor: pointer;
  transition: all var(--transition-base);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.course-name {
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  margin-right: var(--space-2);
  line-height: 1.4;
}

.course-status {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.status-draft {
  background-color: var(--gray-100);
  color: var(--gray-500);
}

.status-pending {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.status-published {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.course-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.info-item {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.info-label {
  color: var(--text-tertiary);
  margin-right: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.course-actions {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.action-btn {
  padding: var(--space-2);
  border: 1px solid var(--gray-200);
  background-color: var(--bg-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background-color: rgba(102, 126, 234, 0.05);
}

.edit-btn {
  grid-column: span 2;
  background-color: var(--gray-50);
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-md);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 响应式 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }
  
  .create-course-btn {
    width: 100%;
  }
}

.semester-selector {
  display: flex;
  align-items: center;
}
</style>
