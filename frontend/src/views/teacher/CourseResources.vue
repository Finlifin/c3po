<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { teacherApi } from '../../api/teacher'
import { ElMessage } from 'element-plus'
import { 
  Document, 
  VideoCamera, 
  Link, 
  Files, 
  Download, 
  View, 
  Upload 
} from '@element-plus/icons-vue'

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

const route = useRoute()

// 状态变量
const modules = ref<Module[]>([])
const course = ref<Course | null>(null)
const loading = ref(false)

// 上传资源相关状态
const showUploadModal = ref(false)
const currentModuleId = ref('')
const resourceType = ref<'VIDEO' | 'PDF' | 'LINK' | 'OTHER'>('PDF')
const resourceName = ref('')
const resourceLink = ref('')
const resourceFile = ref<File | null>(null)
const uploading = ref(false)

// 获取课程章节及资源
const fetchCourseModules = async (courseId: string) => {
  loading.value = true
  try {
    const response = await teacherApi.getCourseModules(courseId)
    modules.value = response.data.data
    // 按displayOrder升序排列章节
    modules.value.sort((a, b) => a.displayOrder - b.displayOrder)
  } catch (err: any) {
    console.error('Failed to fetch course modules:', err)
    ElMessage.error('获取课程资源失败')
  } finally {
    loading.value = false
  }
}

// 获取课程信息
const fetchCourseInfo = async (courseId: string) => {
  try {
    const response = await teacherApi.getCourse(courseId)
    course.value = response.data.data
  } catch (err: any) {
    console.error('Failed to fetch course info:', err)
    ElMessage.error('获取课程信息失败')
  }
}

// 监听路由参数变化
watch(
  () => route.params.courseId,
  (newCourseId) => {
    if (newCourseId) {
      fetchCourseInfo(newCourseId as string)
      fetchCourseModules(newCourseId as string)
    }
  },
  { immediate: true }
)

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 下载资源
const downloadResource = (resource: Resource) => {
  if (resource.downloadUrl) {
    window.open(resource.downloadUrl, '_blank')
  }
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
}

// 处理文件选择
const handleFileChange = (uploadFile: any) => {
  resourceFile.value = uploadFile.raw
}

const uploadFileToImageService = async (): Promise<string> => {
  if (!resourceFile.value) {
    throw new Error('未选择文件');
  }

  const formData = new FormData();
  formData.append('file', resourceFile.value);

  try {
    const response = await teacherApi.uploadFile(formData);
    if (!response.data.success) {
      throw new Error(response.data.error || '文件上传失败');
    }
    return response.data.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('上传失败');
  }
};

// 提交资源
const submitResource = async () => {
  if (!resourceName.value.trim()) {
    ElMessage.warning('请输入资源名称')
    return
  }

  if (resourceType.value === 'LINK' && !resourceLink.value.trim()) {
    ElMessage.warning('请输入链接地址')
    return
  }

  if (resourceType.value !== 'LINK' && !resourceFile.value) {
    ElMessage.warning('请选择文件')
    return
  }

  uploading.value = true

  try {
    let downloadUrl: string | null = null

    // 如果不是LINK类型，先上传文件
    if (resourceType.value !== 'LINK') {
      downloadUrl = await uploadFileToImageService()
    }

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

    await teacherApi.createResource(currentModuleId.value, resourceData)
    
    ElMessage.success('资源上传成功')
    showUploadModal.value = false
    
    // 刷新列表
    if (route.params.courseId) {
      fetchCourseModules(route.params.courseId as string)
    }

  } catch (err: any) {
    console.error('上传资源失败:', err)
    ElMessage.error(err.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'VIDEO': return VideoCamera
    case 'PDF': return Document
    case 'LINK': return Link
    default: return Files
  }
}
</script>

<template>
  <div class="course-resources-container">
    <div class="header">
      <h2>课程资源管理</h2>
    </div>

    <!-- 课程信息卡片 -->
    <el-card class="course-info-card" v-if="course">
      <el-descriptions title="课程信息" :column="4" border>
        <el-descriptions-item label="课程名称">{{ course.name }}</el-descriptions-item>
        <el-descriptions-item label="学期">{{ course.semester }}</el-descriptions-item>
        <el-descriptions-item label="学分">{{ course.credit }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="course.status === 'PUBLISHED' ? 'success' : 'info'">
            {{ course.status }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 章节列表 -->
    <div class="modules-section" v-loading="loading">
      <el-empty v-if="!loading && modules.length === 0" description="暂无章节数据" />
      
      <div v-else>
        <el-card v-for="module in modules" :key="module.id" class="module-card">
          <template #header>
            <div class="module-header">
              <div class="module-title">
                <span class="module-order">第 {{ module.displayOrder }} 节</span>
                <h4>{{ module.title }}</h4>
              </div>
              <el-button type="primary" size="small" @click="openUploadModal(module.id)">
                <el-icon class="el-icon--left"><Upload /></el-icon>上传资源
              </el-button>
            </div>
          </template>
          
          <div class="module-content">
            <div class="module-meta">
              <span class="release-date">
                发布时间: {{ new Date(module.releaseAt).toLocaleString() }}
              </span>
            </div>
            
            <!-- 资源列表 -->
            <div class="resources-list">
              <h5>资源列表</h5>
              <el-empty v-if="module.resources.length === 0" description="暂无资源" :image-size="60" />
              <div v-else class="resource-grid">
                <div 
                  v-for="resource in module.resources" 
                  :key="resource.id"
                  class="resource-item"
                >
                  <div class="resource-icon">
                    <el-icon :size="24"><component :is="getResourceIcon(resource.type)" /></el-icon>
                  </div>
                  <div class="resource-info">
                    <div class="resource-name" :title="resource.name">{{ resource.name }}</div>
                    <div class="resource-meta">
                      <el-tag size="small" effect="plain">{{ resource.type }}</el-tag>
                      <span class="resource-size">{{ formatFileSize(resource.fileSize) }}</span>
                    </div>
                  </div>
                  <div class="resource-actions">
                    <el-button 
                      type="primary" 
                      link 
                      :icon="Download"
                      @click="downloadResource(resource)"
                      :disabled="!resource.downloadUrl"
                    >
                      下载
                    </el-button>
                    <el-button 
                      type="success" 
                      link 
                      :icon="View"
                      @click="downloadResource(resource)"
                      :disabled="!resource.downloadUrl"
                    >
                      查看
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 上传资源弹窗 -->
    <el-dialog
      v-model="showUploadModal"
      title="上传资源"
      width="500px"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="资源类型" required>
          <el-select v-model="resourceType" class="w-full">
            <el-option label="PDF文档" value="PDF" />
            <el-option label="视频" value="VIDEO" />
            <el-option label="链接" value="LINK" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="资源名称" required>
          <el-input v-model="resourceName" placeholder="请输入资源名称" />
        </el-form-item>
        
        <el-form-item v-if="resourceType === 'LINK'" label="链接地址" required>
          <el-input v-model="resourceLink" placeholder="请输入链接地址" />
        </el-form-item>
        
        <el-form-item v-else label="选择文件" required>
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            :show-file-list="true"
          >
            <template #trigger>
              <el-button type="primary">选取文件</el-button>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadModal = false">取消</el-button>
          <el-button type="primary" @click="submitResource" :loading="uploading">
            确定上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.course-resources-container {
  padding: 0;
}

.header {
  margin-bottom: 20px;
}

.course-info-card {
  margin-bottom: 20px;
}

.module-card {
  margin-bottom: 20px;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.module-title h4 {
  margin: 0;
  font-size: 1.1rem;
}

.module-order {
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.module-meta {
  margin-bottom: 15px;
  color: #909399;
  font-size: 0.9rem;
}

.resources-list h5 {
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: #303133;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.resource-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.resource-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.resource-icon {
  margin-right: 15px;
  color: #409eff;
  display: flex;
  align-items: center;
}

.resource-info {
  flex: 1;
  overflow: hidden;
}

.resource-name {
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.resource-size {
  font-size: 0.8rem;
  color: #909399;
}

.resource-actions {
  display: flex;
  gap: 5px;
}

.w-full {
  width: 100%;
}
</style>
