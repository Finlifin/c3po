<script setup lang="ts">
// 导入依赖
import { onMounted, ref } from 'vue'
import axios from 'axios'
import router from '../../router'
import TeacherSidebar from '../../components/TeacherSidebar.vue'
import { ElTable, ElTableColumn, ElSelect, ElOption, ElPagination } from 'element-plus'

// API 配置
const API_BASE_URL = 'http://10.70.141.134:8080/api/v1'

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
const user = ref<any>(null)
const error = ref('')
const notifications = ref<Notification[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalNotifications = ref(0)
const targetTypeFilter = ref('')

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录')
    }
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    user.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取用户信息失败'
    // 令牌无效时重定向到登录页
    localStorage.removeItem('token')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('expiresIn')
    router.push('/teacher')
  }
}

// 获取通知列表
const fetchNotifications = async () => {
  try {
    isLoading.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录')
    }
    
    // 构建查询参数
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
  await fetchUserInfo()
  await fetchNotifications()
})
</script>

<template>
  <div class="notification-center">
    <!-- 左侧菜单栏 -->
    <TeacherSidebar activeMenu="notifications" />

    <!-- 右侧主内容 -->
    <div class="main-content">
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
  </div>
</template>

<style scoped>
/* 全局布局 */
.notification-center {
  display: flex;
  min-height: 100vh;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  margin-left: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow-x: hidden;
}

/* 内容区域 */
.content {
  padding: 30px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 筛选区域 */
.filter-section {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 通知列表 */
.notifications-section h2 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 20px;
}

.loading, .empty-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.error-message {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
  margin-bottom: 20px;
}

/* 表格样式 */
.notifications-section :deep(.el-table) {
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.notifications-section :deep(.el-table__header-wrapper) {
  border-radius: 12px 12px 0 0;
}

.notifications-section :deep(.el-table__body-wrapper) {
  border-radius: 0 0 12px 12px;
}

.table-content {
  max-width: 500px;
  white-space: normal;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.pagination :deep(.el-pagination) {
  margin: 0;
}

/* 空状态 */
.empty-notifications :deep(.el-empty) {
  margin: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    width: 100%;
  }
  
  .content {
    padding: 15px;
    margin: 0;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    padding: 15px;
  }
  
  .filter-section .el-select {
    width: 100%;
    margin-right: 0;
    margin-bottom: 15px;
  }
}
</style>
