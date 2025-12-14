<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { notificationApi } from '../../api/notification'
import { ElMessage } from 'element-plus'

// 类型定义
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

// 响应式数据
// const router = useRouter()
// const authStore = useAuthStore()
const notifications = ref<Notification[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalNotifications = ref(0)
const targetTypeFilter = ref('')

// 获取通知列表
const fetchNotifications = async () => {
  try {
    isLoading.value = true
    
    // 构建查询参数
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (targetTypeFilter.value) {
      params.targetType = targetTypeFilter.value
    }
    
    const response = await notificationApi.getNotifications(params)
    
    notifications.value = response.data.data || []
    totalNotifications.value = response.data.meta?.total || 0
  } catch (err: any) {
    console.error('获取通知失败:', err)
    ElMessage.error(err.message || '获取通知失败')
  } finally {
    isLoading.value = false
  }
}

// 处理分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchNotifications()
}

// 处理每页条数变化
const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchNotifications()
}

// 处理筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchNotifications()
}

// 获取通知类型标签样式
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'announcement': 'primary',
    'reminder': 'warning',
    'system': 'info'
  }
  return typeMap[type] || 'default'
}

// 获取通知状态标签样式
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    'DRAFT': 'info',
    'SCHEDULED': 'warning',
    'SENT': 'success',
    'FAILED': 'danger'
  }
  return statusMap[status] || 'default'
}

// 获取发送渠道标签样式
const getChannelTagType = (channel: string) => {
  const channelMap: Record<string, string> = {
    'INBOX': 'primary',
    'EMAIL': 'success',
    'SMS': 'warning'
  }
  return channelMap[channel] || 'default'
}

// 生命周期钩子
onMounted(async () => {
  await fetchNotifications()
})
</script>

<template>
  <div class="notification-center-container">
    <div class="header">
      <h2>我的通知</h2>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <el-select 
        v-model="targetTypeFilter" 
        placeholder="选择通知类型" 
        clearable
        @change="handleFilterChange"
        style="width: 200px;"
      >
        <el-option label="全部类型" value=""></el-option>
        <el-option label="公告" value="announcement"></el-option>
        <el-option label="提醒" value="reminder"></el-option>
        <el-option label="系统通知" value="system"></el-option>
      </el-select>
    </div>

    <!-- 通知列表 -->
    <div class="notifications-section">
      <el-card shadow="hover">
        <el-table 
          v-loading="isLoading" 
          :data="notifications" 
          stripe 
          style="width: 100%"
        >
          <el-table-column prop="title" label="标题" width="200" show-overflow-tooltip />
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
          <el-table-column prop="content" label="内容" min-width="300">
            <template #default="scope">
              <div class="table-content">{{ scope.row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="sendChannels" label="发送渠道" width="150">
            <template #default="scope">
              <div class="channel-tags">
                <el-tag 
                  v-for="channel in scope.row.sendChannels" 
                  :key="channel" 
                  :type="getChannelTagType(channel)"
                  size="small"
                >
                  {{ channel }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="暂无通知" />
          </template>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalNotifications"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.notification-center-container {
  padding: 0;
}

.header {
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.table-content {
  white-space: normal;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.channel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
