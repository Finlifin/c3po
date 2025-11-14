<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'

// 用户数据
const users = ref([
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@student.edu.cn',
    role: 'student',
    status: 'active',
    studentId: '202201001',
    major: '计算机科学与技术',
    registerTime: '2024-01-10',
    lastLogin: '2024-01-15 14:30'
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@student.edu.cn',
    role: 'student',
    status: 'pending',
    studentId: '202201002',
    major: '软件工程',
    registerTime: '2024-01-14',
    lastLogin: '未登录'
  },
  {
    id: 3,
    name: '王教授',
    email: 'wang@teacher.edu.cn',
    role: 'teacher',
    status: 'active',
    employeeId: 'T2023001',
    department: '计算机学院',
    registerTime: '2024-01-08',
    lastLogin: '2024-01-15 16:20'
  },
  {
    id: 4,
    name: '赵同学',
    email: 'zhao@student.edu.cn',
    role: 'student',
    status: 'suspended',
    studentId: '202201003',
    major: '网络工程',
    registerTime: '2024-01-12',
    lastLogin: '2024-01-13 10:15'
  },
  {
    id: 5,
    name: '陈老师',
    email: 'chen@teacher.edu.cn',
    role: 'teacher',
    status: 'pending',
    employeeId: 'T2023002',
    department: '信息工程学院',
    registerTime: '2024-01-15',
    lastLogin: '未登录'
  }
])

// 搜索和筛选
const searchQuery = ref('')
const activeFilter = ref('all')

// 模态框状态
const reviewModalVisible = ref(false)
const userModalVisible = ref(false)
const currentUser = ref(null)
const reviewComment = ref('')

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    'student': '学生',
    'teacher': '教师',
    'admin': '管理员'
  }
  return roleMap[role] || role
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'active': '已激活',
    'pending': '待审核',
    'suspended': '已禁用'
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (dateString) => {
  if (dateString === '未登录') return dateString
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 筛选用户
const filterUsers = (filter) => {
  activeFilter.value = filter
}

// 计算过滤后的用户列表
const filteredUsers = computed(() => {
  let result = [...users.value]

  // 状态筛选
  if (activeFilter.value !== 'all') {
    result = result.filter(user => user.status === activeFilter.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }

  return result
})

// 查看用户
const viewUser = (userId) => {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    currentUser.value = user
    userModalVisible.value = true
  }
}

// 编辑用户
const editUser = (userId) => {
  alert(`编辑用户 ${userId} - 实际项目中会打开编辑表单`)
}

// 打开审核模态框
const openReviewModal = (userId) => {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    currentUser.value = user
    reviewComment.value = ''
    reviewModalVisible.value = true
  }
}

// 关闭审核模态框
const closeReviewModal = () => {
  reviewModalVisible.value = false
  currentUser.value = null
  reviewComment.value = ''
}

// 审核通过
const approveUser = () => {
  if (currentUser.value) {
    currentUser.value.status = 'active'
    closeReviewModal()
    alert('用户审核通过')
  }
}

// 审核驳回
const rejectUser = () => {
  if (currentUser.value) {
    currentUser.value.status = 'suspended'
    closeReviewModal()
    alert('用户审核已驳回')
  }
}

// 关闭用户详情模态框
const closeUserModal = () => {
  userModalVisible.value = false
  currentUser.value = null
}

// 切换用户状态
const toggleUserStatus = (userId) => {
  if (userId) {
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.status = user.status === 'active' ? 'suspended' : 'active'
      alert(`用户状态已更新为：${getStatusText(user.status)}`)
    }
  } else if (currentUser.value) {
    currentUser.value.status = currentUser.value.status === 'active' ? 'suspended' : 'active'
    const user = users.value.find(u => u.id === currentUser.value.id)
    if (user) {
      user.status = currentUser.value.status
    }
    alert(`用户状态已更新为：${getStatusText(currentUser.value.status)}`)
  }
}

// 删除用户
const deleteUser = () => {
  if (confirm('确定要删除这个用户吗？此操作不可恢复。')) {
    if (currentUser.value) {
      const index = users.value.findIndex(u => u.id === currentUser.value.id)
      if (index > -1) {
        users.value.splice(index, 1)
        closeUserModal()
        alert('用户已删除')
      }
    }
  }
}

// 搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}
</script>

<template>
  <MainLayout>
    <main class="main-content">
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">用户管理</h1>
          <div class="search-bar">
            <input 
              type="text" 
              class="search-input" 
              placeholder="搜索用户..."
              v-model="searchQuery"
              @input="handleSearch"
            >
            <button class="btn btn-primary" @click="handleSearch">搜索</button>
          </div>
        </div>
      </header>

      <div class="filter-tabs">
        <button 
          class="filter-tab" 
          :class="{ active: activeFilter === 'all' }"
          @click="filterUsers('all')"
        >
          全部用户
        </button>
        <button 
          class="filter-tab" 
          :class="{ active: activeFilter === 'pending' }"
          @click="filterUsers('pending')"
        >
          待审核
        </button>
        <button 
          class="filter-tab" 
          :class="{ active: activeFilter === 'active' }"
          @click="filterUsers('active')"
        >
          已激活
        </button>
        <button 
          class="filter-tab" 
          :class="{ active: activeFilter === 'suspended' }"
          @click="filterUsers('suspended')"
        >
          已禁用
        </button>
      </div>

      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>用户信息</th>
              <th>角色</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>最后登录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-info">
                  <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                  <div class="user-details">
                    <h4>{{ user.name }}</h4>
                    <p>{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="`role-${user.role}`">
                  {{ getRoleText(user.role) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="`status-${user.status}`">
                  {{ getStatusText(user.status) }}
                </span>
              </td>
              <td>{{ formatDate(user.registerTime) }}</td>
              <td>{{ user.lastLogin }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-secondary btn-sm" @click="viewUser(user.id)">查看</button>
                  <button class="btn btn-primary btn-sm" @click="editUser(user.id)">编辑</button>
                  <button 
                    v-if="user.status === 'pending'"
                    class="btn btn-primary btn-sm" 
                    @click="openReviewModal(user.id)"
                  >
                    审核
                  </button>
                  <button 
                    v-else
                    class="btn btn-warning btn-sm" 
                    @click="toggleUserStatus(user.id)"
                  >
                    {{ user.status === 'active' ? '禁用' : '激活' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- 审核用户模态框 -->
    <div v-if="reviewModalVisible" class="modal active" @click.self="closeReviewModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">审核用户</h2>
          <button class="modal-close" @click="closeReviewModal">&times;</button>
        </div>
        <div v-if="currentUser" class="review-user-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">姓名</label>
              <input 
                id="reviewName" 
                class="form-input" 
                :value="currentUser.name"
                readonly
              >
            </div>
            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input 
                id="reviewEmail" 
                class="form-input" 
                :value="currentUser.email"
                readonly
              >
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">角色</label>
              <input 
                id="reviewRole" 
                class="form-input" 
                :value="getRoleText(currentUser.role)"
                readonly
              >
            </div>
            <div class="form-group">
              <label class="form-label">注册时间</label>
              <input 
                id="reviewRegisterTime" 
                class="form-input" 
                :value="formatDate(currentUser.registerTime)"
                readonly
              >
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">审核意见（可选）</label>
            <textarea 
              class="form-input form-textarea" 
              placeholder="填写审核意见..."
              v-model="reviewComment"
            ></textarea>
          </div>
          <div class="text-right">
            <button class="btn btn-secondary" @click="closeReviewModal">取消</button>
            <button class="btn btn-danger" @click="rejectUser">驳回</button>
            <button class="btn btn-primary" @click="approveUser">通过</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户详情模态框 -->
    <div v-if="userModalVisible" class="modal active" @click.self="closeUserModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">用户详情</h2>
          <button class="modal-close" @click="closeUserModal">&times;</button>
        </div>
        
        <div v-if="currentUser" class="user-details">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">姓名</label>
              <input 
                type="text" 
                class="form-input" 
                :value="currentUser.name"
                readonly
              >
            </div>
            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input 
                type="email" 
                class="form-input" 
                :value="currentUser.email"
                readonly
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">角色</label>
              <input 
                type="text" 
                class="form-input" 
                :value="getRoleText(currentUser.role)"
                readonly
              >
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <input 
                type="text" 
                class="form-input" 
                :value="getStatusText(currentUser.status)"
                readonly
              >
            </div>
          </div>
          
          <div v-if="currentUser.role === 'student'" class="form-row">
            <div class="form-group">
              <label class="form-label">学号</label>
              <input 
                type="text" 
                class="form-input" 
                :value="currentUser.studentId"
                readonly
              >
            </div>
            <div class="form-group">
              <label class="form-label">专业</label>
              <input 
                type="text" 
                class="form-input" 
                :value="currentUser.major"
                readonly
              >
            </div>
          </div>
          
          <div v-else-if="currentUser.role === 'teacher'" class="form-row">
            <div class="form-group">
              <label class="form-label">工号</label>
              <input 
                type="text" 
                class="form-input" 
                :value="currentUser.employeeId"
                readonly
              >
            </div>
            <div class="form-group">
              <label class="form-label">部门</label>
              <input 
                type="text" 
                class="form-input" 
                :value="currentUser.department"
                readonly
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">注册时间</label>
              <input 
                type="text" 
                class="form-input" 
                :value="formatDate(currentUser.registerTime)"
                readonly
              >
            </div>
            <div class="form-group">
              <label class="form-label">最后登录</label>
              <input 
                type="text" 
                class="form-input" 
                :value="currentUser.lastLogin"
                readonly
              >
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeUserModal">关闭</button>
          <button type="button" class="btn btn-warning" @click="toggleUserStatus">切换状态</button>
          <button type="button" class="btn btn-danger" @click="deleteUser">删除用户</button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.main-content {
  padding: 24px;
  min-height: 100vh;
}

.page-header {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.search-bar {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  padding: 12px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 12px;
  font-size: 16px;
  width: 300px;
}

.search-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #ffffff;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #86868b;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 14px;
}

.filter-tab.active {
  background: #ff3b30;
  color: white;
}

.users-table-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #d1d1d6;
}

.users-table th {
  background: #f2f2f7;
  font-weight: 600;
  color: #1d1d1f;
}

.users-table td {
  color: #86868b;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007aff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-details h4 {
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 4px;
  margin-top: 0;
  font-size: 14px;
}

.user-details p {
  font-size: 14px;
  color: #86868b;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.status-pending {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.status-suspended {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.role-student {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.role-teacher {
  background: rgba(88, 86, 214, 0.1);
  color: #5856d6;
}

.role-admin {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.action-buttons {
  display: flex;
  gap: 8px;
  opacity: 1 !important;
  visibility: visible !important;
}

.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  align-items: center;
  justify-content: center;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d1d1d6;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #86868b;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
}

.modal-close:hover {
  color: #1d1d1f;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d1d6;
  border-radius: 12px;
  font-size: 16px;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-input[readonly] {
  background-color: #f2f2f7;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.text-right {
  text-align: right;
  margin-top: 24px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  gap: 8px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
  min-height: 36px;
}

.btn-primary {
  background-color: #007aff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056cc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background-color: #ffffff;
  color: #1d1d1f;
  border: 1px solid #d1d1d6;
}

.btn-secondary:hover {
  background-color: #f2f2f7;
  transform: translateY(-1px);
}

.btn-warning {
  background-color: #ff9500;
  color: white;
}

.btn-warning:hover {
  background-color: #e08400;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-danger {
  background-color: #ff3b30;
  color: white;
}

.btn-danger:hover {
  background-color: #d70015;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .search-input {
    width: 100%;
  }

  .filter-tabs {
    flex-wrap: wrap;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .users-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
