<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import StudentSidebar from '../../components/StudentSidebar.vue'
import { onMounted, ref, watch } from 'vue'

// 资源数据类型定义
interface Resource {
  id: string
  type: 'VIDEO' | 'PDF' | 'LINK' | 'OTHER'
  name: string
  fileSize: number
  downloadUrl: string
  createdAt?: string
  updatedAt?: string
}

// 章节数据类型定义
interface Module {
  id: string
  courseId: string
  title: string
  displayOrder: number
  releaseAt: string
  resources: Resource[]
}

// 课程数据类型定义
interface Course {
  id: string
  name: string
  semester: string
  credit: number
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  teacherId: string
  createdAt: string
  updatedAt: string
}

// 学生课程相关接口已删除

// 状态变量
const modules = ref<Module[]>([])
const course = ref<Course | null>(null)
// courseStats 状态变量已删除
const loading = ref(false)
const error = ref('')
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

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
  localStorage.removeItem('user')
  router.push('/student')
}

// 获取课程章节及资源
const fetchCourseModules = async (courseId: string) => {
  if (!checkAuth()) return
  
  loading.value = true
  error.value = ''
  
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/modules`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    modules.value = response.data.data
    // 按displayOrder升序排列章节
    modules.value.sort((a, b) => a.displayOrder - b.displayOrder)
    
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程资源失败'
    console.error('Failed to fetch course modules:', err)
  } finally {
    loading.value = false
  }
}

// 获取课程信息
const fetchCourseInfo = async (courseId: string) => {
  if (!checkAuth()) return
  
  try {
    const token = getToken()
    const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    course.value = response.data.data
    
  } catch (err: any) {
    console.error('Failed to fetch course info:', err)
  }
}

// fetchCourseStats 函数已删除

// 监听路由参数变化
watch(
  () => router.currentRoute.value.params.courseId,
  (newCourseId) => {
    if (newCourseId) {
      fetchCourseInfo(newCourseId as string)
      fetchCourseModules(newCourseId as string)
    }
  },
  { immediate: true }
)

// 页面加载时获取数据
onMounted(() => {
  const courseId = router.currentRoute.value.params.courseId as string
  if (courseId) {
    fetchCourseInfo(courseId)
    fetchCourseModules(courseId)
  }
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 下载资源
const downloadResource = (resource: Resource) => {
  window.open(resource.downloadUrl, '_blank')
}
</script>

<template>
  <div class="course-resources">
    <!-- 左侧菜单栏 -->
    <StudentSidebar activeMenu="courses" @logout="logout" />
    
    <div class="main-content">
    
      
      <div class="content">
        <!-- 课程信息卡片 -->
        <div class="course-info-card">
          <div class="course-info-item">
            <span class="label">课程名称:</span>
            <span class="value">{{ course?.name || '-' }}</span>
          </div>
          <div class="course-info-item">
            <span class="label">学期:</span>
            <span class="value">{{ course?.semester || '-' }}</span>
          </div>
          <div class="course-info-item">
            <span class="label">学分:</span>
            <span class="value">{{ course?.credit || '-' }}</span>
          </div>
          <div class="course-info-item">
            <span class="label">教师ID:</span>
            <span class="value">{{ course?.teacherId || '-' }}</span>
          </div>
        </div>
        
        <!-- 作业完成情况已删除 -->
        
        <!-- 章节列表 -->
        <div class="modules-section">
          <h3>课程章节</h3>
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <div v-else-if="modules.length === 0" class="empty">暂无章节数据</div>
          <div v-else>
            <div v-for="module in modules" :key="module.id" class="module-card">
              <div class="module-header">
                <h4>{{ module.title }}</h4>
                <div class="module-header-actions">
                  <span class="module-order">第 {{ module.displayOrder }} 节</span>
                </div>
              </div>
              <div class="module-content">
                <div class="module-meta">
                  <span class="release-date">
                  
                  </span>
                </div>
                
                <!-- 资源列表 -->
                <div class="resources-list">
                  
                  <div v-if="module.resources.length === 0" class="no-resources">暂无资源</div>
                  <div v-else>
                    <div 
                      v-for="resource in module.resources" 
                      :key="resource.id"
                      class="resource-item"
                    >
                      <div class="resource-icon">
                        <span v-if="resource.type === 'VIDEO'">&#127916;</span>
                        <span v-else-if="resource.type === 'PDF'">&#128490;</span>
                        <span v-else-if="resource.type === 'LINK'">&#128279;</span>
                        <span v-else-if="resource.type === 'OTHER'">&#128206;</span>
                        <span v-else>\&#128206;</span>
                      </div>
                      <div class="resource-info">
                        <div class="resource-name">{{ resource.name }}</div>
                        <div class="resource-meta">
                          <span class="resource-type">{{ resource.type }}</span>
                          <span class="resource-size">{{ formatFileSize(resource.fileSize) }}</span>
                        </div>
                      </div>
                      <div class="resource-actions">
                        <button 
                          class="download-btn"
                          @click="downloadResource(resource)"
                          :disabled="!resource.downloadUrl"
                        >
                          下载
                        </button>
                        <button 
                          class="view-btn"
                          @click="downloadResource(resource)"
                          :disabled="!resource.downloadUrl"
                        >
                          查看
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-resources {
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  overflow: hidden;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  margin-left: 110px; /* 与侧边栏宽度一致 */
  display: flex;
  flex-direction: column;
  width: calc(100vw - 280px);
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content {
  padding: 30px;
   max-width: 80%; /* 取消最大宽度限制，让内容占满主区域 */
  margin: 0; /* 去掉自动居中的外边距 */
  width: 80%;
  box-sizing: border-box;
}

/* 课程信息卡片 */
.course-info-card {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  align-items: center;
}

.course-info-item {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 1rem;
}

.course-info-item .label {
  font-weight: 600;
  color: #666;
}

.course-info-item .value {
  color: #333;
}

/* 作业完成情况相关样式已删除 */

/* 章节列表 */
.modules-section {
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.modules-section h3 {
  font-size: 1.5rem;
  margin: 0 0 20px 0;
  color: #333;
}

.loading, .error, .empty, .no-resources {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 1rem;
}

.module-card {
  background-color: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 25px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.module-header h4 {
  font-size: 1.2rem;
  margin: 0;
  color: #333;
  font-weight: 600;
}

.module-order {
  padding: 5px 12px;
  background-color: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.module-header-actions {
  display: flex;
  align-items: center;
}

.module-content {
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.module-meta {
  margin-bottom: 20px;
}

.release-date {
  color: #666;
  font-size: 0.9rem;
}

/* 资源列表 */
.resources-list {
  margin-top: 20px;
}

.resources-list h5 {
  font-size: 1rem;
  margin: 0 0 15px 0;
  color: #333;
  font-weight: 600;
}

.resource-item {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.resource-item:hover {
  background-color: #e9ecef;
}

.resource-icon {
  font-size: 1.5rem;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.resource-meta {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  gap: 20px;
}

.resource-type {
  padding: 3px 8px;
  background-color: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 10px;
  font-size: 0.75rem;
}

.resource-size {
  font-size: 0.8rem;
}

.resource-actions {
  display: flex;
  gap: 10px;
}

.resource-actions button {
  padding: 8px 15px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-btn {
  background-color: #667eea;
  color: white;
}

.download-btn:hover:not(:disabled) {
  background-color: #5568d3;
}

.view-btn {
  background-color: #4caf50;
  color: white;
}

.view-btn:hover:not(:disabled) {
  background-color: #43a047;
}

.download-btn:disabled, .view-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
  }
  
  .content {
    padding: 15px;
  }
  
  .course-info-card,
  .stats-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>