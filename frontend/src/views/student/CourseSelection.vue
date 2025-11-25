<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import { onMounted, ref, computed } from 'vue'
import StudentSidebar from '../../components/StudentSidebar.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 课程数据类型定义
interface CourseMetrics {
  enrolledCount: number
  assignments: number
  modules: number
}

interface CourseResponse {
  id: string
  name: string
  semester: string
  credit: number
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  enrollLimit: number
  teacherId: string
  createdAt: string
  updatedAt: string
  metrics: CourseMetrics
}

// 选课响应类型定义
interface CourseEnrollmentResponse {
  selectionId: string
  courseId: string
  studentId: string
  status: 'ENROLLED' | 'DROPPED'
  selectedAt: string
}

// 状态变量
const courses = ref<CourseResponse[]>([])
const enrolledCourses = ref<any[]>([])
const userInfo = ref<any>(null)
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const selectedTeacherId = ref('')
const selectedStatus = ref<'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | ''>('')

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// 获取token
const getToken = () => {
  return localStorage.getItem('token')
}

// 检查token有效性
const checkAuth = () => {
  const token = getToken()
  if (!token) {
    router.push('/student')
    return false
  }
  return true
}

// 处理退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('expiresIn')
  router.push('/student')
}

// 获取课程列表
const fetchCourses = async () => {
  if (!checkAuth()) return
  
  loading.value = true
  error.value = ''
  
  try {
    const token = getToken()
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      teacherId: selectedTeacherId.value,
      status: selectedStatus.value,
      sort: 'createdAt,desc'
    }
    
    const response = await axios.get(`${API_BASE_URL}/courses`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    })
    
    courses.value = response.data.data
    // 处理分页信息
    total.value = response.data.meta.total
    
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('Failed to fetch courses:', err)
  } finally {
    loading.value = false
  }
}

// 选课
const enrollCourse = async (course: CourseResponse) => {
  if (!checkAuth()) return
  
  try {
    await ElMessageBox.confirm(
      `确定选择"${course.name}"吗？`,
      '选课确认',
      {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }
    )
    
    const token = getToken()
    await axios.post(`${API_BASE_URL}/courses/${course.id}/enroll`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    // 更新已选课程和课程列表
    await fetchEnrolledCourses()
    await fetchCourses()
    ElMessage.success('选课成功')
    
  } catch (err: any) {
    if (err.name === 'ElMessageBoxCancel') {
      return // 用户取消操作
    }
    const errorMsg = err.response?.data?.message || '选课失败'
    console.error('Failed to enroll course:', err)
    ElMessage.error(errorMsg)
  }
}

// 退课
const dropCourse = async (course: CourseResponse) => {
  if (!checkAuth()) return
  
  try {
    await ElMessageBox.confirm(
      `确定退课"${course.name}"吗？`,
      '退课确认',
      {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }
    )
    
    const token = getToken()
    await axios.delete(`${API_BASE_URL}/courses/${course.id}/enroll`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    // 更新已选课程和课程列表
    await fetchEnrolledCourses()
    await fetchCourses()
    ElMessage.success('退课成功')
    
  } catch (err: any) {
    if (err.name === 'ElMessageBoxCancel') {
      return // 用户取消操作
    }
    const errorMsg = err.response?.data?.message || '退课失败'
    console.error('Failed to drop course:', err)
    ElMessage.error(errorMsg)
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  if (!checkAuth()) return
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    userInfo.value = response.data
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || '获取用户信息失败'
    console.error(errorMsg)
    ElMessage.error(errorMsg)
  }
}

// 获取已选课程
const fetchEnrolledCourses = async () => {
  if (!userInfo.value?.id || !checkAuth()) return
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/students/${userInfo.value.id}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    enrolledCourses.value = response.data.data || []
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || '获取已选课程失败'
    console.error(errorMsg)
    ElMessage.error(errorMsg)
  }
}

// 页面加载时初始化数据
onMounted(async () => {
  await fetchUserInfo()
  await fetchEnrolledCourses()
  await fetchCourses()
})



// 计算课程的选中状态
const processedCourses = computed(() => {
  return courses.value.map(course => {
    const enrolled = enrolledCourses.value.find(ec => ec.courseId === course.id)
    return {
      ...course,
      isEnrolled: !!enrolled && enrolled.selectionStatus === 'ENROLLED',
      selectionStatus: enrolled?.selectionStatus || null
    }
  })
})

// 搜索和筛选
const handleSearch = () => {
  page.value = 1
  fetchCourses()
}

// 页码变更
const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchCourses()
}
</script>

<template>
  <div class="student-dashboard">
    <!-- 左侧菜单栏 -->
    <StudentSidebar activeMenu="course-selection" @logout="logout" />
    
    <!-- 右侧主内容 -->
    <div class="main-content">
      <div class="content">
        <!-- 搜索和筛选 -->
        <div class="filter-section">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchKeyword"
              placeholder="搜索课程名称"
              @input="handleSearch"
            >
          </div>
          <div class="filter-options">
            <select v-model="selectedStatus" @change="handleSearch">
              <option value="">全部</option>
              <option value="PUBLISHED">已发布</option>
              <option value="DRAFT">草稿</option>
              <option value="PENDING_REVIEW">待审核</option>
              <option value="ARCHIVED">已归档</option>
            </select>
            <input 
              type="text" 
              v-model="selectedTeacherId"
              placeholder="教师ID"
              @input="handleSearch"
            >
          </div>
        </div>
        
        <!-- 课程列表 -->
        <div class="courses-section">
          <div class="section-title">
            <h2>课程列表</h2>
            <span class="total-count">共 {{ total }} 门课程</span>
          </div>
          
          <el-table 
            :data="processedCourses" 
            border 
            stripe 
            style="width: 100%" 
            v-loading="loading"
          >
            <el-table-column prop="name" label="课程名称" min-width="200" align="left"></el-table-column>
            <el-table-column prop="semester" label="学期" min-width="100"></el-table-column>
            <el-table-column prop="credit" label="学分" width="80"></el-table-column>
            <el-table-column prop="status" label="课程状态">
              <template #default="{ row }">
                <el-tag 
                  :type="row.status === 'PUBLISHED' ? 'success' : 
                        row.status === 'DRAFT' ? 'warning' : 
                        row.status === 'PENDING_REVIEW' ? 'info' : 'danger'"
                >
                  {{ row.status === 'PUBLISHED' ? '已发布' : 
                     row.status === 'DRAFT' ? '草稿' : 
                     row.status === 'PENDING_REVIEW' ? '待审核' : '已归档' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="metrics.enrolledCount" label="选课人数" width="120">
              <template #default="{ row }">
                {{ row.metrics.enrolledCount }}/{{ row.enrollLimit }}
              </template>
            </el-table-column>
            <el-table-column prop="metrics.modules" label="模块数" width="80"></el-table-column>
            <el-table-column prop="metrics.assignments" label="作业数" width="80"></el-table-column>
            <el-table-column prop="isEnrolled" label="选课状态">
              <template #default="{ row }">
                <el-tag :type="row.isEnrolled ? 'success' : 'info'">
                  {{ row.isEnrolled ? '已选' : '未选' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="120" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.isEnrolled" 
                  type="danger" 
                  size="small" 
                  @click="dropCourse(row)"
                >
                  退课
                </el-button>
                <el-button 
                  v-else 
                  type="success" 
                  size="small" 
                  :disabled="row.metrics.enrolledCount >= row.enrollLimit || row.status !== 'PUBLISHED'"
                  @click="enrollCourse(row)"
                >
                  选课
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination">
            <button 
              class="page-btn" 
              :disabled="page <= 1"
              @click="handlePageChange(page - 1)"
            >
              上一页
            </button>
            <span class="page-info">第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
            <button 
              class="page-btn" 
              :disabled="page * pageSize >= total"
              @click="handlePageChange(page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-dashboard {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  overflow: hidden;
}



/* 右侧主内容 */
.main-content {
  
  flex: 1;
  margin-left: 2px;
  display: flex;
  flex-direction: column;
  width: calc(100vw - 280px);
}

.main-content .header {
  background-color: white;
  color: #333;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-left .hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.header-left .hamburger span {
  width: 25px;
  height: 3px;
  background-color: #333;
  border-radius: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  text-align: right;
}

.user-info .username {
  display: block;
  font-weight: 600;
  font-size: 1.1rem;
}

.user-info .email {
  display: block;
  font-size: 0.9rem;
  opacity: 0.7;
}

.content {
  margin-left: 160px;
  padding: 30px;
  max-width: 1400px;
 
  width: 100%;
  box-sizing: border-box;
}

/* 搜索和筛选 */
.filter-section {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box input {
  padding: 12px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  width: 300px;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-box input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.filter-options {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-options select, .filter-options input {
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.filter-options select:focus, .filter-options input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* 课程列表 */
.courses-section {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-title h2 {
  color: #333;
  font-size: 1.8rem;
  margin: 0;
}

.total-count {
  color: #666;
  font-size: 0.95rem;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.course-card {
  background-color: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 25px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
  cursor: pointer;
}

.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.course-name {
  color: #333;
  font-size: 1.3rem;
  margin: 0;
  font-weight: 600;
}

.course-status {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-PUBLISHED {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.status-DRAFT {
  background-color: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.status-PENDING_REVIEW {
  background-color: rgba(255, 235, 59, 0.1);
  color: #ffeb3b;
}

.status-ARCHIVED {
  background-color: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.course-description {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.course-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.metric-label {
  color: #666;
}

.metric-value {
  color: #333;
  font-weight: 500;
}

.course-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.enroll-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.enroll-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.enroll-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drop-btn {
  background-color: #f44336;
  color: white;
}

.drop-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.pagination button:hover:not(:disabled) {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
  font-weight: 600;
}

.page-btn {
  padding: 10px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  color: #333;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.95rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    width: 100vw;
  }
  
  .header-left .hamburger {
    display: flex;
  }
  
  .content {
    padding: 15px;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>