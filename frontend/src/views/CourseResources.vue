<script setup lang="ts">
import router from '../router'
import axios from 'axios'
import TeacherSidebar from '../components/TeacherSidebar.vue'
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

// 状态变量
const modules = ref<Module[]>([])
const course = ref<Course | null>(null)
const loading = ref(false)
const error = ref('')
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// 上传资源相关状态
const showUploadModal = ref(false)
const currentModuleId = ref('')
const resourceType = ref<'VIDEO' | 'PDF' | 'LINK' | 'OTHER'>('PDF')
const resourceName = ref('')
const resourceLink = ref('')
const resourceFile = ref<File | null>(null)
const uploading = ref(false)
const uploadError = ref('')

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
    // 根据当前路由重定向到相应的登录页面
    if (router.currentRoute.value.path.startsWith('/teacher')) {
      router.push('/teacher')
    } else {
      router.push('/student')
    }
    return false
  }
  return true
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

// 打开上传弹窗
const openUploadModal = (moduleId: string) => {
  currentModuleId.value = moduleId
  showUploadModal.value = true
  // 重置表单
  resourceType.value = 'PDF'
  resourceName.value = ''
  resourceLink.value = ''
  resourceFile.value = null
  uploadError.value = ''
}

// 关闭上传弹窗
const closeUploadModal = () => {
  showUploadModal.value = false
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    resourceFile.value = target.files[0] as File
  }
}

const uploadFileToImageService = async (): Promise<string> => {
  if (!resourceFile.value) {
    throw new Error('未选择文件');
  }

  const formData = new FormData();
  formData.append('file', resourceFile.value);

  try {
    const response = await axios.post('http://10.70.141.134:5000/api/v1/images/upload', formData);
    console.log('Response:', response);  // 这里用 console.log 查看完整的响应
    if (!response.data.success) {
      throw new Error(response.data.error || '文件上传失败');
    }
    return response.data.url;
  } catch (error) {
    console.error('Error uploading file:', error);  // 捕获并输出详细错误
    throw new Error('上传失败');
  }
};



// 创建资源记录
const createResourceRecord = async (downloadUrl: string | null = null) => {
  if (!currentModuleId.value) {
    throw new Error('未指定章节ID')
  }

  const token = getToken()
  const resourceData: any = {
    type: resourceType.value,
    name: resourceName.value
  }

  // 如果是LINK类型，使用输入的链接
  if (resourceType.value === 'LINK') {
    resourceData.downloadUrl = resourceLink.value
  } 
  // 如果是其他类型且有下载URL，设置downloadUrl
  else if (downloadUrl) {
    resourceData.downloadUrl = `http://10.70.141.134:5000/api/v1/images/${downloadUrl}`
    // 设置文件大小
    if (resourceFile.value) {
      resourceData.fileSize = resourceFile.value.size
    }
  }

  const response = await axios.post(
    `${API_BASE_URL}/modules/${currentModuleId.value}/resources`,
    resourceData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data.data
}

// 提交资源
const submitResource = async () => {
  if (!resourceName.value.trim()) {
    uploadError.value = '请输入资源名称'
    return
  }

  if (resourceType.value === 'LINK' && !resourceLink.value.trim()) {
    uploadError.value = '请输入链接地址'
    return
  }

  if (resourceType.value !== 'LINK' && !resourceFile.value) {
    uploadError.value = '请选择文件'
    return
  }

  uploading.value = true
  uploadError.value = ''

  try {
    let downloadUrl: string | null = null

    // 如果不是LINK类型，先上传文件
    if (resourceType.value !== 'LINK') {
      downloadUrl = await uploadFileToImageService()
    }

    // 创建资源记录
    const newResource = await createResourceRecord(downloadUrl)

    // 更新本地数据
    const module = modules.value.find(m => m.id === currentModuleId.value)
    if (module) {
      module.resources.push(newResource)
    }

    // 关闭弹窗
    closeUploadModal()
  } catch (err: any) {
    console.error('上传资源失败:', err)
    uploadError.value = err.response?.data?.message || err.message || '上传失败'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="course-resources">
    <!-- 左侧菜单栏 -->
    <TeacherSidebar activeMenu="course-resources" />
    
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
                  <button class="upload-btn" @click="openUploadModal(module.id)">
                    上传资源
                  </button>
                  <span class="module-order">第 {{ module.displayOrder }} 节</span>
                </div>
              </div>
              <div class="module-content">
                <div class="module-meta">
                  <span class="release-date">
                    发布时间: {{ new Date(module.releaseAt).toLocaleString() }}
                  </span>
                </div>
                
                <!-- 资源列表 -->
                <div class="resources-list">
                  <h5>资源</h5>
                  <div v-if="module.resources.length === 0" class="no-resources">暂无资源</div>
                  <div v-else>
                    <div 
                      v-for="resource in module.resources" 
                      :key="resource.id"
                      class="resource-item"
                    >
                      <div class="resource-icon">
                        <span v-if="resource.type === 'VIDEO'">🎥</span>
                        <span v-else-if="resource.type === 'PDF'">📄</span>
                        <span v-else-if="resource.type === 'LINK'">🔗</span>
                        <span v-else-if="resource.type === 'OTHER'">📎</span>
                        <span v-else>📎</span>
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
  
  <!-- 上传资源弹窗 -->
  <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>上传资源</h3>
        <button class="close-btn" @click="closeUploadModal">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitResource">
          <div class="form-group">
            <label>资源类型:</label>
            <select v-model="resourceType" class="form-control">
              <option value="VIDEO">视频</option>
              <option value="PDF">PDF文档</option>
              <option value="LINK">链接</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>资源名称:</label>
            <input 
              v-model="resourceName" 
              type="text" 
              class="form-control" 
              placeholder="请输入资源名称"
              required
            />
          </div>
          
          <div v-if="resourceType === 'LINK'" class="form-group">
            <label>链接地址:</label>
            <input 
              v-model="resourceLink" 
              type="url" 
              class="form-control" 
              placeholder="请输入链接地址"
              required
            />
          </div>
          
          <div v-else class="form-group">
            <label>选择文件:</label>
            <input 
              type="file" 
              class="form-control" 
              @change="handleFileSelect"
              required
            />
          </div>
          
          <div v-if="uploadError" class="error-message">
            {{ uploadError }}
          </div>
          
          <div class="modal-footer">
            <button 
              type="button" 
              class="cancel-btn" 
              @click="closeUploadModal"
              :disabled="uploading"
            >
              取消
            </button>
            <button 
              type="submit" 
              class="submit-btn" 
              :disabled="uploading"
            >
              {{ uploading ? '上传中...' : '确定上传' }}
            </button>
          </div>
        </form>
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

/* 左侧菜单栏 */
.sidebar {
  width: 280px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.sidebar-header .logo {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.sidebar-header .logo img {
  width: 50px;
  height: 50px;
}

.sidebar-header h1 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.sidebar-menu {
  padding: 20px 0;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.menu-item:hover {
  background-color: #f0f0f0;
  border-left-color: #667eea;
}

.menu-item.active {
  background-color: rgba(102, 126, 234, 0.1);
  border-left-color: #667eea;
  font-weight: 600;
}

.menu-icon {
  font-size: 1.2rem;
}

.menu-text {
  font-size: 0.95rem;
  color: #333;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  margin-left: 2px; /* 关键修复：设置合适的左边距 */
  display: flex;
  flex-direction: column;
  width: calc(100vw - 283px); /* 关键修复：正确计算可用宽度 */
  min-height: 98vh;
  background-color: #ffffff;
  border-radius: 24px 0 0 22px; /* 可选：圆角效果 */
  
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

.header-left h2 {
  font-size: 1.5rem;
  margin: 0 20px;
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
  padding: 30px 15px; /* 上下30px，左右15px，大幅缩小左右间隔 */
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
  gap: 15px;
}

.upload-btn {
  padding: 6px 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.upload-btn:hover {
  background-color: #5568d3;
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

/* 模态弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn, .submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-btn {
  background-color: #f1f1f1;
  color: #333;
}

.submit-btn {
  background-color: #667eea;
  color: white;
}

.cancel-btn:disabled, .submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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
  
  .course-info-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>