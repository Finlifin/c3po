<template>
  <PageContainer>
    <div v-loading="loading">
      <!-- 个人信息卡片 -->
      <el-card class="profile-card" shadow="hover">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="showAvatarUpload = true">
              <el-avatar
                v-if="profile?.avatarUrl"
                :src="getAvatarImageUrl(profile.avatarUrl)"
                :size="120"
                class="profile-avatar"
              />
              <el-avatar
                v-else
                :size="120"
                class="profile-avatar"
              >
                {{ profile?.username?.charAt(0).toUpperCase() || 'U' }}
              </el-avatar>
              <div class="avatar-overlay">
                <el-icon :size="24"><Camera /></el-icon>
                <span>更换头像</span>
              </div>
            </div>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ profile?.username }}</h2>
            <p class="profile-role">{{ isStudent ? '学生' : '教师' }}</p>
            <div class="profile-meta">
              <div class="meta-item">
                <span class="meta-label">邮箱：</span>
                <span class="meta-value">{{ profile?.email }}</span>
              </div>
              <div v-if="profile?.studentProfile" class="meta-item">
                <span class="meta-label">学号：</span>
                <span class="meta-value">{{ profile.studentProfile.studentNo }}</span>
              </div>
              <div v-if="profile?.studentProfile?.grade" class="meta-item">
                <span class="meta-label">年级：</span>
                <span class="meta-value">{{ profile.studentProfile.grade }}</span>
              </div>
              <div v-if="profile?.studentProfile?.major" class="meta-item">
                <span class="meta-label">专业：</span>
                <span class="meta-value">{{ profile.studentProfile.major }}</span>
              </div>
              <div v-if="profile?.studentProfile?.className" class="meta-item">
                <span class="meta-label">班级：</span>
                <span class="meta-value">{{ profile.studentProfile.className }}</span>
              </div>
              <div v-if="profile?.teacherProfile" class="meta-item">
                <span class="meta-label">工号：</span>
                <span class="meta-value">{{ profile.teacherProfile.teacherNo }}</span>
              </div>
              <div v-if="profile?.teacherProfile?.department" class="meta-item">
                <span class="meta-label">部门：</span>
                <span class="meta-value">{{ profile.teacherProfile.department }}</span>
              </div>
              <div v-if="profile?.teacherProfile?.title" class="meta-item">
                <span class="meta-label">职称：</span>
                <span class="meta-value">{{ profile.teacherProfile.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 个人统计 -->
      <div class="stats-section">
        <h3 class="section-title">个人统计</h3>
        <StatsGrid>
          <el-card
            v-for="stat in statsCards"
            :key="stat.key"
            class="stat-card"
            shadow="hover"
          >
            <div class="stat-content">
              <div class="stat-icon" :class="stat.iconClass">
                <span>{{ stat.icon }}</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-card>
        </StatsGrid>
      </div>

      <!-- 信息编辑表单 -->
      <el-card class="edit-section" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>编辑个人信息</h3>
            <el-button
              v-if="!isEditing"
              type="primary"
              @click="startEdit"
            >
              编辑
            </el-button>
            <div v-else class="edit-actions">
              <el-button @click="cancelEdit">取消</el-button>
              <el-button type="primary" @click="saveProfile" :loading="saving">
                保存
              </el-button>
            </div>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="editForm"
          :rules="formRules"
          label-width="100px"
          :disabled="!isEditing"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="editForm.username" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="editForm.email" type="email" />
          </el-form-item>

          <template v-if="isStudent">
            <el-form-item label="年级" prop="grade">
              <el-input v-model="editForm.grade" />
            </el-form-item>

            <el-form-item label="专业" prop="major">
              <el-input v-model="editForm.major" />
            </el-form-item>

            <el-form-item label="班级" prop="className">
              <el-input v-model="editForm.className" />
            </el-form-item>
          </template>

          <template v-else>
            <el-form-item label="部门" prop="department">
              <el-input v-model="editForm.department" />
            </el-form-item>

            <el-form-item label="职称" prop="title">
              <el-input v-model="editForm.title" />
            </el-form-item>

            <el-form-item label="科目" prop="subjects">
              <el-input
                v-model="editForm.subjects"
                type="textarea"
                :rows="3"
                placeholder="多个科目用逗号分隔"
              />
            </el-form-item>
          </template>
        </el-form>
      </el-card>
    </div>

    <!-- 头像上传对话框 -->
    <el-dialog
      v-model="showAvatarUpload"
      title="上传头像"
      width="400px"
    >
      <el-upload
        ref="uploadRef"
        class="avatar-uploader"
        :auto-upload="false"
        :on-change="handleAvatarChange"
        :show-file-list="false"
        accept="image/*"
        :limit="1"
      >
        <el-avatar
          v-if="avatarPreview"
          :src="avatarPreview"
          :size="200"
        />
        <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
      </el-upload>
      <div class="upload-tips">
        <p>支持 JPG、PNG、GIF 格式，文件大小不超过 2MB</p>
      </div>
      <template #footer>
        <el-button @click="showAvatarUpload = false">取消</el-button>
        <el-button type="primary" @click="uploadAvatar" :loading="uploading">
          上传
        </el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { profileApi } from '../api/profile'
import { ossApi } from '../api/oss'
import PageContainer from '../components/layout/PageContainer.vue'
import StatsGrid from '../components/layout/StatsGrid.vue'
import type { Profile, ProfileStats, UpdateProfileRequest } from '../types/profile'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'

const route = useRoute()
const authStore = useAuthStore()

const isStudent = computed(() => route.path.startsWith('/student'))

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const isEditing = ref(false)
const showAvatarUpload = ref(false)
const avatarPreview = ref('')
const selectedFile = ref<File | null>(null)

const profile = ref<Profile | null>(null)
const stats = ref<ProfileStats | null>(null)

const formRef = ref<FormInstance>()
const uploadRef = ref()

const editForm = reactive<UpdateProfileRequest>({
  username: '',
  email: '',
  grade: '',
  major: '',
  className: '',
  department: '',
  title: '',
  subjects: ''
})

const formRules: FormRules = {
  username: [
    { min: 3, max: 64, message: '用户名长度必须在3-64个字符之间', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const statsCards = computed(() => {
  if (!stats.value) return []
  
  if (isStudent.value) {
    return [
      {
        key: 'courses',
        label: '已选课程',
        value: stats.value.enrolledCoursesCount || 0,
        icon: '📚',
        iconClass: 'icon-primary'
      },
      {
        key: 'completed',
        label: '已完成作业',
        value: stats.value.completedAssignmentsCount || 0,
        icon: '✅',
        iconClass: 'icon-success'
      },
      {
        key: 'pending',
        label: '待完成作业',
        value: stats.value.pendingAssignmentsCount || 0,
        icon: '📝',
        iconClass: 'icon-warning'
      },
      {
        key: 'average',
        label: '平均成绩',
        value: stats.value.averageScore ? stats.value.averageScore.toFixed(1) : '--',
        icon: '📊',
        iconClass: 'icon-info'
      },
      {
        key: 'gpa',
        label: 'GPA',
        value: stats.value.gpa ? stats.value.gpa.toFixed(2) : '--',
        icon: '⭐',
        iconClass: 'icon-primary'
      }
    ]
  } else {
    return [
      {
        key: 'courses',
        label: '授课课程',
        value: stats.value.teachingCoursesCount || 0,
        icon: '📚',
        iconClass: 'icon-primary'
      },
      {
        key: 'pending',
        label: '待批改作业',
        value: stats.value.pendingGradingCount || 0,
        icon: '📝',
        iconClass: 'icon-warning'
      },
      {
        key: 'students',
        label: '学生总数',
        value: stats.value.totalStudentsCount || 0,
        icon: '👥',
        iconClass: 'icon-info'
      }
    ]
  }
})

const fetchProfile = async () => {
  try {
    loading.value = true
    const response = await profileApi.getProfile()
    // 处理ApiResponse结构
    if (response.data.success) {
      profile.value = response.data.data
      resetEditForm()
    } else {
      throw new Error(response.data.error?.message || '获取个人信息失败')
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || err.message || '获取个人信息失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await profileApi.getProfileStats()
    // 处理ApiResponse结构
    if (response.data.success) {
      stats.value = response.data.data
    }
  } catch (err: any) {
    console.error('获取统计信息失败:', err)
  }
}

const resetEditForm = () => {
  if (profile.value) {
    editForm.username = profile.value.username
    editForm.email = profile.value.email
    if (profile.value.studentProfile) {
      editForm.grade = profile.value.studentProfile.grade || ''
      editForm.major = profile.value.studentProfile.major || ''
      editForm.className = profile.value.studentProfile.className || ''
    }
    if (profile.value.teacherProfile) {
      editForm.department = profile.value.teacherProfile.department || ''
      editForm.title = profile.value.teacherProfile.title || ''
      editForm.subjects = profile.value.teacherProfile.subjects || ''
    }
  }
}

const startEdit = () => {
  resetEditForm()
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  resetEditForm()
}

const saveProfile = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    const updateData: UpdateProfileRequest = {
      username: editForm.username,
      email: editForm.email
    }

    if (isStudent.value) {
      updateData.grade = editForm.grade
      updateData.major = editForm.major
      updateData.className = editForm.className
    } else {
      updateData.department = editForm.department
      updateData.title = editForm.title
      updateData.subjects = editForm.subjects
    }

    const response = await profileApi.updateProfile(updateData)
    if (response.data.success) {
      profile.value = response.data.data
      await authStore.fetchUserInfo() // 更新store中的用户信息
      isEditing.value = false
      ElMessage.success('保存成功')
    } else {
      throw new Error(response.data.error?.message || '保存失败')
    }
  } catch (err: any) {
    if (err.fields) {
      // 表单验证错误
      return
    }
    ElMessage.error(err.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleAvatarChange = (file: UploadFile) => {
  if (!file.raw) return

  // 验证文件类型
  const isImage = file.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return
  }

  // 验证文件大小（2MB）
  const isLt2M = file.raw.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }

  selectedFile.value = file.raw

  // 预览图片
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
}

const getAvatarImageUrl = (avatarUrl: string) => {
  // If avatarUrl is already a full URL, return it
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl
  }
  // Otherwise, construct OSS URL
  const ossBaseUrl = import.meta.env.VITE_OSS_BASE_URL || 'http://localhost:5000'
  return `${ossBaseUrl}/api/v1/images/${avatarUrl}`
}

const uploadAvatar = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择图片')
    return
  }

  try {
    uploading.value = true

    // 上传到OSS
    const uploadResult = await ossApi.uploadImage(selectedFile.value)
    if (!uploadResult.success || !uploadResult.url) {
      ElMessage.error(uploadResult.error || '上传失败')
      return
    }

    // 更新头像URL
    const response = await profileApi.updateAvatar(uploadResult.url)
    if (response.data.success) {
      profile.value = response.data.data
      await authStore.fetchUserInfo() // 更新store中的用户信息

      showAvatarUpload.value = false
      avatarPreview.value = ''
      selectedFile.value = null
      ElMessage.success('头像上传成功')
    } else {
      throw new Error(response.data.error?.message || '更新头像失败')
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

onMounted(async () => {
  await fetchProfile()
  await fetchStats()
})
</script>

<style scoped>
.profile-card {
  margin-bottom: var(--space-8);
}

.profile-header {
  display: flex;
  gap: var(--space-8);
  align-items: flex-start;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: var(--radius-full);
  overflow: hidden;
  transition: all var(--transition-base);
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity var(--transition-base);
  gap: var(--space-2);
}

.avatar-overlay span {
  font-size: var(--text-sm);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.profile-role {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6) 0;
}

.profile-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.meta-item {
  display: flex;
  gap: var(--space-2);
}

.meta-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.meta-value {
  color: var(--text-primary);
}

.stats-section {
  margin-bottom: var(--space-8);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.stat-card {
  transition: all var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.icon-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
}

.stat-icon.icon-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon.icon-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.icon-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.edit-section {
  margin-bottom: var(--space-8);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.edit-actions {
  display: flex;
  gap: var(--space-3);
}

.avatar-uploader {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.avatar-uploader-icon {
  font-size: 4rem;
  color: var(--text-tertiary);
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius-lg);
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
}

.avatar-uploader-icon:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.upload-tips {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.upload-tips p {
  margin: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-meta {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .profile-name {
    font-size: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .edit-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
