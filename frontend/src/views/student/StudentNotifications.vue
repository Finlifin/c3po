<script setup lang="ts">
import router from '../../router'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { ElTable, ElTableColumn, ElSelect, ElOption, ElPagination } from 'element-plus'
import { useStudentAuthStore } from '../../stores/auth_student'

const authStore = useStudentAuthStore()
const token = authStore.token
// User data
const user = ref<any>(null)
const error = ref('')

// API configuration
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

// Notifications data
interface Notification {
  id: string;
  targetType: string;
  title: string;
  content: string;
  sendChannels: string[];
  status: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

const notifications = ref<Notification[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalNotifications = ref(0)
const targetTypeFilter = ref('')

// Fetch user information
const fetchUserInfo = async () => {
  try {
 
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    user.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取用户信息失败'
    // Redirect to login if token is invalid
    localStorage.removeItem('StuToken')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('expiresIn')
    router.push('/student')
  }
}

// Fetch notifications
const fetchNotifications = async () => {
  try {
    isLoading.value = true
    if (!token) {
      throw new Error('未登录')
    }
    
    // Build query params
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (targetTypeFilter.value) {
      params.targetType = targetTypeFilter.value
    }
    
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    notifications.value = response.data.data || []
    totalNotifications.value = response.data.meta?.total || 0
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取通知失败'
    console.error('获取通知失败:', err)
  } finally {
    isLoading.value = false
  }
}

// Handle pagination
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchNotifications()
}

// Handle page size change
const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchNotifications()
}

// Handle filter change
const handleFilterChange = () => {
  currentPage.value = 1
  fetchNotifications()
}

// Get tag type for notification type
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'announcement': 'primary',
    'reminder': 'warning',
    'system': 'info'
  }
  return typeMap[type] || 'default'
}

// Get tag type for notification status
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    'DRAFT': 'info',
    'SCHEDULED': 'warning',
    'SENT': 'success',
    'FAILED': 'danger'
  }
  return statusMap[status] || 'default'
}

// Get tag type for send channel
const getChannelTagType = (channel: string) => {
  const channelMap: Record<string, string> = {
    'INBOX': 'primary',
    'EMAIL': 'success',
    'SMS': 'warning'
  }
  return channelMap[channel] || 'default'
}

// Load data on mount
onMounted(async () => {
  await fetchUserInfo()
  await fetchNotifications()
})
</script>

<template>
  <div class="student-notifications-page">
    <div class="page-header">
      <h1>通知中心</h1>
    </div>

    <div class="content">
        <!-- 筛选和搜索 -->
        <div class="filter-section">
          <el-select 
            v-model="targetTypeFilter" 
            placeholder="选择通知类型" 
            clearable
            @change="handleFilterChange"
            style="width: 200px; margin-right: 20px;"
          >
            <el-option label="全部类型" value=""></el-option>
            <el-option label="公告" value="announcement"></el-option>
            <el-option label="提醒" value="reminder"></el-option>
            <el-option label="系统通知" value="system"></el-option>
          </el-select>
        </div>

        <!-- 通知列表 -->
        <div class="notifications-section">
          <h2>我的通知</h2>
          
          <div v-if="isLoading" class="loading">
            <el-table :data="[]" stripe style="width: 100%">
              <el-table-column prop="title" label="标题" width="200"></el-table-column>
              <el-table-column prop="targetType" label="类型" width="100"></el-table-column>
              <el-table-column prop="status" label="状态" width="100"></el-table-column>
              <el-table-column prop="sentAt" label="发送时间" width="180"></el-table-column>
              <el-table-column prop="content" label="内容"></el-table-column>
              <el-table-column prop="sendChannels" label="发送渠道" width="150"></el-table-column>
            </el-table>
          </div>
          
          <div v-else-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div v-else-if="notifications.length === 0" class="empty-notifications">
            <el-empty description="暂无通知"></el-empty>
          </div>
          
          <div v-else>
            <el-table :data="notifications" stripe style="width: 100%">
              <el-table-column prop="title" label="标题" width="200"></el-table-column>
              <el-table-column prop="targetType" label="类型" width="100">
                <template #default="scope">
                  <el-tag :type="getTypeTagType(scope.row.targetType)">
                    {{ scope.row.targetType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusTagType(scope.row.status)">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sentAt" label="发送时间" width="180">
                <template #default="scope">
                  {{ new Date(scope.row.sentAt).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="content" label="内容">
                <template #default="scope">
                  <div class="table-content">{{ scope.row.content }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="sendChannels" label="发送渠道" width="150">
                <template #default="scope">
                  <el-tag size="small" v-for="channel in scope.row.sendChannels" :key="channel" :type="getChannelTagType(channel)">
                    {{ channel }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalNotifications > 0" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalNotifications"
            :prev-text="'上一页'"
            :next-text="'下一页'"
            :sizes-text="'条/页'"
            :total-text="'共 '"
            :jump-text="'跳至'"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          ></el-pagination>
        </div>
    </div>
  </div>
</template>

<style scoped>
.student-notifications-page {
  padding: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-header h1 {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.filter-section {
  background-color: var(--bg-primary);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.notifications-section {
  background-color: var(--bg-primary);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.notifications-section h2 {
  color: var(--text-primary);
  font-size: var(--text-xl);
  font-weight: 700;
  margin: 0 0 var(--space-6) 0;
}

.loading, 
.empty-notifications {
  text-align: center;
  padding: var(--space-10);
  color: var(--text-secondary);
}

.error-message {
  background-color: rgba(231, 76, 60, 0.1);
  color: var(--error);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--error);
  margin-bottom: var(--space-5);
}

.table-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  margin-top: var(--space-8);
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .student-notifications-page {
    padding: var(--space-4);
  }
}
</style>