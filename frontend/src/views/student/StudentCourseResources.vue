<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import { onMounted, ref, watch } from 'vue'
import { useStudentAuthStore } from '../../stores/auth_student'

const authStore = useStudentAuthStore() 
const token = authStore.token
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

// AI总结响应数据类型定义
interface AISummaryResponse {
  traceId: string
  success: boolean
  data: {
    conversationId: string
    answer: string
    references: any[]
    suggestions: any[]
    usage: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

// 状态变量
const modules = ref<Module[]>([])
const course = ref<Course | null>(null)
// courseStats 状态变量已删除
const loading = ref(false)
const error = ref('')
// AI总结相关状态
const aiLoading = ref(false)
const aiSummary = ref<AISummaryResponse | null>(null)
const selectedModuleId = ref<string | null>(null)

// API配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'




// 获取课程章节及资源
const fetchCourseModules = async (courseId: string) => {
  loading.value = true
  error.value = ''
  
  try {
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
  
  try {
    
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

// 获取AI总结
const fetchAISummary = async (courseId: string, moduleId: string) => {
  aiLoading.value = true
  selectedModuleId.value = moduleId
  
  try {
    const response = await axios.get(`${API_BASE_URL}/assistant/summary`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        courseId,
        moduleId
      }
    })
    
    aiSummary.value = response.data
    
  } catch (err: any) {
    console.error('Failed to fetch AI summary:', err)
    error.value = err.response?.data?.message || '获取AI总结失败'
  } finally {
    aiLoading.value = false
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
  <div class="course-resources-page">
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
                  <button 
                    class="ai-summary-btn"
                    @click="fetchAISummary(course?.id || '', module.id)"
                    :disabled="aiLoading"
                  >
                    <span v-if="aiLoading && selectedModuleId === module.id">加载中...</span>
                    <span v-else>AI总结</span>
                  </button>
                </div>
              </div>
              <div class="module-content">
                <div class="module-meta">
                  <span class="release-date">
                  
                  </span>
                </div>
                
                <!-- AI总结结果显示 -->
                <div v-if="aiSummary && selectedModuleId === module.id" class="ai-summary-section">
                  <div class="ai-summary-header">
                    <h5>章节知识点总结</h5>
                    <button class="ai-summary-close-btn" @click="aiSummary = null">
                      ×
                    </button>
                  </div>
                  <div class="ai-summary-content">
                    <p>{{ aiSummary.data.answer }}</p>
                  </div>
                  
                  <!-- 学习建议 -->
                  <div v-if="aiSummary.data.suggestions && aiSummary.data.suggestions.length > 0" class="ai-suggestions">
                    <h6>学习建议</h6>
                    <ul>
                      <li v-for="(suggestion, index) in aiSummary.data.suggestions" :key="index">
                        {{ suggestion }}
                      </li>
                    </ul>
                  </div>
                  
                  <!-- 参考资料 -->
                  <div v-if="aiSummary.data.references && aiSummary.data.references.length > 0" class="ai-references">
                    <h6>参考资料</h6>
                    <ul>
                      <li v-for="(reference, index) in aiSummary.data.references" :key="index">
                        <a :href="reference.url" target="_blank">{{ reference.title }}</a>
                      </li>
                    </ul>
                  </div>
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
                        <span v-if="resource.type === 'VIDEO'">🎬</span>
                        <span v-else-if="resource.type === 'PDF'">📄</span>
                        <span v-else-if="resource.type === 'LINK'">🔗</span>
                        <span v-else-if="resource.type === 'OTHER'">📁</span>
                        <span v-else>📁</span>
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
</template>

<style scoped>
.course-resources-page {
  padding: var(--space-6);
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
  margin-right: 10px;
}

.module-header-actions {
  display: flex;
  align-items: center;
}

/* AI总结按钮样式 */
.ai-summary-btn {
  padding: 8px 15px;
  background-color: #f093fb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ai-summary-btn:hover:not(:disabled) {
  background-color: #f5576c;
}

.ai-summary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* AI总结结果样式 */
.ai-summary-section {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.ai-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.ai-summary-section h5 {
  font-size: 1.1rem;
  margin: 0;
  color: #0369a1;
  font-weight: 600;
}

.ai-summary-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.ai-summary-close-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}
.ai-summary-content {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  color: #333;
  line-height: 1.6;
}

.ai-suggestions, .ai-references {
  margin-top: 15px;
}

.ai-suggestions h6, .ai-references h6 {
  font-size: 0.95rem;
  margin: 0 0 10px 0;
  color: #075985;
  font-weight: 600;
}

.ai-suggestions ul, .ai-references ul {
  margin: 0;
  padding-left: 20px;
}

.ai-suggestions li, .ai-references li {
  margin-bottom: 8px;
  color: #334155;
  font-size: 0.9rem;
}

.ai-references a {
  color: #0284c7;
  text-decoration: none;
  transition: color 0.3s ease;
}

.ai-references a:hover {
  color: #0369a1;
  text-decoration: underline;
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
  
  .module-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .module-header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>