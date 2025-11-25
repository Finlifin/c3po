<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'
import router from '../router'
import TeacherSidebar from '../components/TeacherSidebar.vue'

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
    
    courses.value = response.data.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('获取课程列表失败:', err)
  } finally {
    isLoading.value = false
  }
}

// 创建课程
const createCourse = async () => {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      throw new Error('未获取到教师ID')
    }
    
    // 将year和season组合成semester字段
    const semester = `${createCourseForm.value.year}${createCourseForm.value.season}`
    
    const requestData = {
      name: createCourseForm.value.name,
      semester: semester,
      credit: createCourseForm.value.credit,
      enrollLimit: createCourseForm.value.enrollLimit,
      teacherId: user.id
    }
    
    // 发送POST请求创建课程
    await axios.post(`${API_BASE_URL}/courses`, requestData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    // 关闭弹窗并刷新课程列表
    isCreateModalVisible.value = false
    fetchCourses()
    
    // 重置表单
    createCourseForm.value = {
      name: '',
      year: new Date().getFullYear().toString(),
      season: '春',
      credit: 0,
      enrollLimit: 0
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '创建课程失败'
    console.error('创建课程失败:', err)
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
    
    // 发送PUT请求更新课程
    await axios.put(`${API_BASE_URL}/courses/${courseId}`, requestData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    // 关闭弹窗并刷新课程列表
    isEditModalVisible.value = false
    fetchCourses()
  } catch (err: any) {
    error.value = err.response?.data?.message || '更新课程失败'
    console.error('更新课程失败:', err)
  }
}

// 页面加载时获取课程列表
onMounted(() => {
  fetchCourses()
})
</script>

<template>
  <div class="course-management">
    <!-- 左侧固定菜单栏 -->
    <TeacherSidebar class="left-menu" activeMenu="course-management" />

    <!-- 右侧主内容区 -->
    <div class="main-content">
      <div class="header">
        <h2>课程管理</h2>
        <button class="create-course-btn" @click="isCreateModalVisible = true">
          <span class="btn-icon">+</span>
          创建课程
        </button>
      </div>

      <!-- 课程列表 -->
      <div class="courses-container">
        <div v-if="isLoading" class="loading">加载中...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="courses.length === 0" class="empty-courses">
          <p>暂无课程，请点击右上角"创建课程"按钮添加课程</p>
        </div>
        <div v-else class="courses-grid">
          <div
            v-for="course in courses"
            :key="course.id"
            class="course-card"
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
          </div>
        </div>
      </div>
    </div>

    <!-- 创建课程弹窗 -->
    <div v-if="isCreateModalVisible" class="modal-overlay" @click="isCreateModalVisible = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>创建新课程</h3>
          <button class="close-btn" @click="isCreateModalVisible = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createCourse" class="create-course-form">
            <div class="form-group">
              <label for="courseName">课程名称</label>
              <input
                type="text"
                id="courseName"
                v-model="createCourseForm.name"
                required
                placeholder="请输入课程名称"
              />
            </div>
            <div class="form-group">
              <label>学期</label>
              <div class="semester-selector">
                <el-select v-model="createCourseForm.year" placeholder="请选择年份" style="width: 120px;" required>
                  <el-option v-for="year in years" :key="year" :label="year" :value="year" />
                </el-select>
                <el-select v-model="createCourseForm.season" placeholder="请选择季节" style="width: 80px;" required>
                  <el-option label="春" value="春" />
                  <el-option label="秋" value="秋" />
                </el-select>
              </div>
            </div>
            <div class="form-group">
              <label for="credit">学分</label>
              <input
                type="number"
                id="credit"
                v-model.number="createCourseForm.credit"
                required
                min="0"
                step="0.5"
                placeholder="请输入学分"
              />
            </div>
            <div class="form-group">
              <label for="enrollLimit">限选人数</label>
              <input
                type="number"
                id="enrollLimit"
                v-model.number="createCourseForm.enrollLimit"
                required
                min="0"
                placeholder="请输入限选人数"
              />
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="isCreateModalVisible = false">取消</button>
              <button type="submit" class="submit-btn">创建课程</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 编辑课程弹窗 -->
    <div v-if="isEditModalVisible" class="modal-overlay" @click="isEditModalVisible = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>编辑课程</h3>
          <button class="close-btn" @click="isEditModalVisible = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateCourse" class="create-course-form">
            <div class="form-group">
              <label for="editCourseName">课程名称</label>
              <input
                type="text"
                id="editCourseName"
                v-model="editCourseForm.name"
                placeholder="请输入课程名称"
              />
            </div>
            <div class="form-group">
              <label>学期</label>
              <div class="semester-selector">
                <el-select v-model="editCourseForm.year" placeholder="请选择年份" style="width: 120px;" required>
                  <el-option v-for="year in years" :key="year" :label="year" :value="year" />
                </el-select>
                <el-select v-model="editCourseForm.season" placeholder="请选择季节" style="width: 80px;" required>
                  <el-option label="春" value="春" />
                  <el-option label="秋" value="秋" />
                </el-select>
              </div>
            </div>
            <div class="form-group">
              <label for="editCredit">学分</label>
              <input
                type="number"
                id="editCredit"
                v-model.number="editCourseForm.credit"
                min="0"
                step="0.5"
                placeholder="请输入学分"
              />
            </div>
            <div class="form-group">
              <label for="editEnrollLimit">限选人数</label>
              <input
                type="number"
                id="editEnrollLimit"
                v-model.number="editCourseForm.enrollLimit"
                min="0"
                placeholder="请输入限选人数"
              />
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="isEditModalVisible = false">取消</button>
              <button type="submit" class="submit-btn">更新课程</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-management {
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

.create-course-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-course-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 1.3rem;
  line-height: 1;
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

.courses-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
}

.course-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid #eef2f7;
  position: relative;
  overflow: hidden;
}

.course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 15px;
}

.course-name {
  margin: 0;
  color: #2d3748;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
  flex: 1;
}

.course-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-draft {
  background-color: #fef3c7;
  color: #92400e;
}

.status-pending {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-published {
  background-color: #d1fae5;
  color: #065f46;
}

.course-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
  padding: 15px 0;
  border-top: 1px dashed #e2e8f0;
  border-bottom: 1px dashed #e2e8f0;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  border-radius: 10px;
  padding: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon {
  font-size: 1.1rem;
}

.info-value {
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 700;
}

.course-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  background-color: #f8fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.action-btn:hover {
  background-color: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-2px);
}

.edit-btn {
  background-color: #eff6ff;
  color: #3b82f6;
  border-color: #bfdbfe;
}

.edit-btn:hover {
  background-color: #dbeafe;
  border-color: #93c5fd;
}

/* 创建课程弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 700;
}

.close-btn {
  background-color: transparent;
  border: none;
  font-size: 1.8rem;
  color: #718096;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #2d3748;
}

.modal-body {
  padding: 25px;
}

.create-course-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 1rem;
  color: #4a5568;
  font-weight: 600;
}

.form-group input {
  padding: 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8fafc;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background-color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 15px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  padding: 12px 24px;
  background-color: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #cbd5e0;
  transform: translateY(-2px);
}

.submit-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .left-menu {
    width: 60px;
  }

  .logo h1 {
    display: none;
  }

  .menu-text {
    display: none;
  }

  .main-content {
    margin-left: 60px;
  }

  .header {
    padding: 15px 20px;
  }

  .courses-container {
    padding: 20px 15px;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .course-card {
    padding: 20px;
  }

  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .course-name {
    font-size: 1.3rem;
  }

  .course-info {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .info-value {
    font-size: 1rem;
  }
}

/* 中等屏幕设备 - 最多显示2个卡片 */
@media (min-width: 769px) and (max-width: 1200px) {
  .courses-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 大屏幕设备 - 最多显示3个卡片 */
@media (min-width: 1201px) {
  .courses-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>