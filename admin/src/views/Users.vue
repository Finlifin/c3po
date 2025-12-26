<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/layout/MainLayout.vue'
import { userAPI } from '../services/api'
import { mockAPI } from '../services/mockData'

const router = useRouter()

// 状态
const users = ref([])
const loading = ref(false)
const error = ref('')
const useMock = ref(false) // 默认使用真实接口，如需演示可切换为 mock
const isChangingStatus = ref(false) // 状态变更操作的加载状态

// 搜索和筛选
const searchQuery = ref('')
const activeFilter = ref('all')

// 模态框状态
const reviewModalVisible = ref(false)
const userModalVisible = ref(false)
const editModalVisible = ref(false)
const currentUser = ref(null)
const reviewComment = ref('')
const isSubmittingEdit = ref(false)
const editForm = ref({
  username: '',
  email: '',
  role: '',
  studentNo: '',
  major: '',
  employeeId: '',
  department: ''
})

// 获取角色文本
const getRoleText = (role) => {
  if (!role) return '未知角色'
  const normalized = role.toLowerCase()
  const roleMap = {
    'student': '学生',
    'teacher': '教师',
    'admin': '管理员'
  }
  return roleMap[normalized] || role
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

const backendStatusToUi = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'LOCKED':
      return 'pending'
    case 'DISABLED':
      return 'suspended'
    default:
      return (status || '').toLowerCase() || 'pending'
  }
}

const uiStatusToBackend = (status) => {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'suspended':
      return 'DISABLED'
    case 'pending':
    default:
      return 'LOCKED'
  }
}

const mapApiUserToUi = (user) => {
  if (!user) {
    return null
  }
  const role = (user.role || '').toLowerCase()
  const status = backendStatusToUi(user.status)
  const studentProfile = user.studentProfile || {}
  const teacherProfile = user.teacherProfile || {}
  
  // 确保 ID 是字符串格式，并验证格式
  let userId = user.id
  if (userId) {
    userId = String(userId)
    // UUID 格式验证（基本检查）
    if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.warn('用户 ID 格式异常:', userId, '原始用户数据:', user)
    }
  }
  
  return {
    id: userId,
    name: user.username || user.name || '未知用户',
    email: user.email || '',
    role,
    status,
    registerTime: user.createdAt || user.registerTime,
    lastLogin: user.lastLogin || '未登录',
    phone: user.phone,
    studentId: studentProfile.studentNo,
    major: studentProfile.major,
    employeeId: teacherProfile.teacherNo,
    department: teacherProfile.department
  }
}

const setUserStatusLocal = (userId, uiStatus) => {
  const index = users.value.findIndex(u => u.id === userId)
  if (index !== -1) {
    users.value[index] = { ...users.value[index], status: uiStatus }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString || dateString === '未登录') return dateString || '--'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return date.toLocaleDateString('zh-CN')
}

// 筛选用户
const filterUsers = (filter) => {
  activeFilter.value = filter
  if (!useMock.value) {
    fetchUsers()
  }
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
  const user = users.value.find(u => u.id === userId)
  if (user) {
    currentUser.value = user
    // 填充编辑表单
    editForm.value = {
      username: user.name || '',
      email: user.email || '',
      role: user.role || '',
      status: user.status || 'active',
      studentNo: user.studentId || '',
      major: user.major || '',
      employeeId: user.employeeId || '',
      department: user.department || ''
    }
    editModalVisible.value = true
  }
}

// 关闭编辑模态框
const closeEditModal = () => {
  editModalVisible.value = false
  currentUser.value = null
  editForm.value = {
    username: '',
    email: '',
    role: '',
    studentNo: '',
    major: '',
    employeeId: '',
    department: ''
  }
}

// 统一错误处理函数
const handleApiError = (err, operationName = '操作') => {
  console.error(`${operationName}失败:`, err)
  let errorMessage = `${operationName}失败`
  
  if (err?.error?.message) {
    errorMessage = err.error.message
  } else if (err?.message) {
    errorMessage = err.message
  }
  
  // 特别处理不同类型的错误
  if (err?.error?.includes('Unauthorized') || errorMessage.includes('Unauthorized')) {
    errorMessage = '认证失败，请重新登录！'
    router.push({ name: 'Login' })
  } else if (err?.status === 403) {
    errorMessage = '权限不足，只有管理员可以执行此操作'
  } else if (err?.status === 400) {
    errorMessage = '请求参数错误，请检查输入信息'
  } else if (err?.status === 404) {
    errorMessage = '请求的资源不存在'
  } else if (err?.status === 409) {
    errorMessage = '数据冲突，请检查输入信息是否已存在'
  } else if (err?.status >= 500) {
    errorMessage = '服务器内部错误，请稍后重试'
  }
  
  alert(errorMessage)
  return errorMessage
}

// 表单验证函数
const validateUserForm = (form) => {
  // 用户名验证
  if (!form.username.trim()) {
    alert('用户名不能为空')
    return false
  }
  
  if (form.username.trim().length < 3 || form.username.trim().length > 50) {
    alert('用户名长度必须在3-50个字符之间')
    return false
  }
  
  // 邮箱验证
  if (!form.email.trim()) {
    alert('邮箱不能为空')
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    alert('请输入有效的邮箱地址')
    return false
  }
  
  return true
}

// 保存编辑
const saveEdit = async () => {
  if (!currentUser.value || !editForm.value) return
  
  try {
    isSubmittingEdit.value = true
    // 验证表单
    if (!validateUserForm(editForm.value)) {
      return
    }
    
    // 构建请求数据
    const userData = {
      username: editForm.value.username.trim(),
      email: editForm.value.email.trim()
    }
    
    // 可选：如果有其他字段也需要更新
    if (editForm.value.status && editForm.value.status !== currentUser.value.status) {
      // 将UI状态转换为后端状态
      const backendStatus = uiStatusToBackend(editForm.value.status)
      userData.status = backendStatus
      // 添加状态变更原因
      const statusReason = backendStatus === 'DISABLED' ? '管理员禁用账号' : backendStatus === 'LOCKED' ? '管理员设置为待审核' : undefined
      if (statusReason) {
        userData.statusReason = statusReason
      }
    }
    
    // 调用API
    await userAPI.updateUser(currentUser.value.id, userData)
    
    // 成功处理
    alert('用户信息更新成功！')
    closeEditModal()
    
    // 刷新用户列表
    await fetchUsers()
  } catch (err) {
    handleApiError(err, '更新用户信息')
  } finally {
    isSubmittingEdit.value = false
  }
}

// 创建用户相关状态
const createUserModalVisible = ref(false)
const isSubmittingCreateUser = ref(false)

// 批量创建用户相关变量
const bulkCreateModalVisible = ref(false)
const isSubmittingBulkCreate = ref(false)
const bulkCreateFormat = ref('json') // json 或 csv
const bulkCreateJsonContent = ref('')
const bulkCreateCsvContent = ref('')
const bulkCreateFile = ref(null)
const bulkCreateResultVisible = ref(false)
const bulkCreateResult = ref({
  success: false,
  message: '',
  created: [],
  errors: []
})

// 重置批量创建表单
const resetBulkCreateForm = () => {
  bulkCreateFormat.value = 'json'
  bulkCreateJsonContent.value = ''
  bulkCreateCsvContent.value = ''
  bulkCreateFile.value = null
  bulkCreateResult.value = {
    success: false,
    message: '',
    created: [],
    errors: []
  }
  bulkCreateResultVisible.value = false
}

// 打开批量创建模态框
const openBulkCreateModal = () => {
  resetBulkCreateForm()
  bulkCreateModalVisible.value = true
}

// 关闭批量创建模态框
const closeBulkCreateModal = () => {
  bulkCreateModalVisible.value = false
  resetBulkCreateForm()
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    bulkCreateFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      bulkCreateCsvContent.value = e.target.result
    }
    reader.readAsText(file)
  }
}

// CSV转换为JSON
const csvToJson = (csv) => {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const result = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.some(v => v)) {
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      result.push(obj)
    }
  }
  
  return result
}

// 准备批量创建用户的数据
const prepareBulkCreateData = () => {
  let users = []
  
  if (bulkCreateFormat.value === 'json') {
    try {
      const jsonData = JSON.parse(bulkCreateJsonContent.value)
      users = Array.isArray(jsonData) ? jsonData : (jsonData.users || [])
    } catch (error) {
      throw new Error('JSON格式不正确')
    }
  } else {
    // CSV格式处理
    const csvUsers = csvToJson(bulkCreateCsvContent.value)
    users = csvUsers.map(user => {
      // 转换CSV数据为API所需的JSON格式
      const result = {
        username: user.username || '',
        email: user.email || '',
        password: user.password || '',
        role: (user.role || 'STUDENT').toUpperCase(),
        status: (user.status || 'ACTIVE').toUpperCase()
      }
      
      // 根据角色添加相应的档案信息
      if (result.role === 'STUDENT') {
        result.studentProfile = {
          studentNo: user.studentNo || '',
          grade: user.grade || undefined,
          major: user.major || undefined,
          className: user.className || undefined
        }
      } else if (result.role === 'TEACHER') {
        result.teacherProfile = {
          teacherNo: user.teacherNo || '',
          department: user.department || undefined,
          title: user.title || undefined,
          subjects: user.subjects ? user.subjects.split(';').map(s => s.trim()) : []
        }
      }
      
      // 如果状态不是ACTIVE，需要添加statusReason
      if (result.status !== 'ACTIVE' && user.statusReason) {
        result.statusReason = user.statusReason
      }
      
      return result
    })
  }
  
  // 验证数据
  if (users.length === 0) {
    throw new Error('没有可创建的用户数据')
  }
  
  return { users }
}

// 批量创建用户
const bulkCreateUsers = async () => {
  try {
    // 调试：检查token
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token:', token);
    
    isSubmittingBulkCreate.value = true
    
    // 准备数据
    const requestData = prepareBulkCreateData()
    
    // 调用API
    const response = await userAPI.bulkCreateUsers(requestData)
    
    // 处理结果
    bulkCreateResult.value = {
      success: true,
      message: `批量创建成功！共创建 ${response.data?.created?.length || 0} 个用户，失败 ${response.data?.errors?.length || 0} 个用户`,
      created: response.data?.created || [],
      errors: response.data?.errors || []
    }
    
    // 显示结果
    bulkCreateResultVisible.value = true
    
    // 如果创建成功，刷新用户列表
    if (response.data?.created?.length > 0) {
      await fetchUsers()
    }
    
  } catch (error) {
    console.error('批量创建用户失败:', error)
    bulkCreateResult.value = {
      success: false,
      message: error.message || '批量创建用户失败',
      created: [],
      errors: []
    }
    bulkCreateResultVisible.value = true
  } finally {
    isSubmittingBulkCreate.value = false
  }
}

const createUserForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  studentNo: '',
  grade: '',
  major: '',
  className: '',
  teacherNo: '',
  department: '',
  title: '',
  subjects: ''
})
const createUserFormErrors = reactive({})

// 重置创建用户表单
const resetCreateUserForm = () => {
  createUserForm.username = ''
  createUserForm.email = ''
  createUserForm.password = ''
  createUserForm.confirmPassword = ''
  createUserForm.role = 'STUDENT'
  createUserForm.status = 'ACTIVE'
  createUserForm.studentNo = ''
  createUserForm.grade = ''
  createUserForm.major = ''
  createUserForm.className = ''
  createUserForm.teacherNo = ''
  createUserForm.department = ''
  createUserForm.title = ''
  createUserForm.subjects = ''
  
  // 清空错误信息
  Object.keys(createUserFormErrors).forEach(key => {
    delete createUserFormErrors[key]
  })
}

const openCreateUserModal = () => {
  resetCreateUserForm()
  createUserModalVisible.value = true
}

const closeCreateUserModal = () => {
  createUserModalVisible.value = false
  resetCreateUserForm()
}

// 表单验证函数
const validateCreateUserForm = () => {
  const errors = {}
  
  // 验证用户名
  if (!createUserForm.username.trim()) {
    errors.username = '用户名不能为空'
  } else if (createUserForm.username.length > 64) {
    errors.username = '用户名长度不能超过64个字符'
  }
  
  // 验证邮箱
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!createUserForm.email.trim()) {
    errors.email = '邮箱不能为空'
  } else if (!emailRegex.test(createUserForm.email)) {
    errors.email = '请输入有效的邮箱地址'
  } else if (createUserForm.email.length > 128) {
    errors.email = '邮箱长度不能超过128个字符'
  }
  
  // 验证密码
  if (!createUserForm.password) {
    errors.password = '密码不能为空'
  } else if (createUserForm.password.length < 8) {
    errors.password = '密码长度至少为8个字符'
  } else if (createUserForm.password.length > 128) {
    errors.password = '密码长度不能超过128个字符'
  }
  
  // 验证确认密码
  if (createUserForm.password !== createUserForm.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
  }
  
  // 验证角色特定字段
  if (createUserForm.role === 'STUDENT' && !createUserForm.studentNo.trim()) {
    errors.studentNo = '学号不能为空'
  }
  
  if (createUserForm.role === 'TEACHER' && !createUserForm.teacherNo.trim()) {
    errors.teacherNo = '工号不能为空'
  }
  
  // 清空并填充错误信息
  Object.keys(createUserFormErrors).forEach(key => {
    delete createUserFormErrors[key]
  })
  Object.assign(createUserFormErrors, errors)
  return Object.keys(errors).length === 0
}

// 创建用户函数
const createUser = async () => {
  // 验证表单
  if (!validateCreateUserForm()) {
    return
  }
  
  try {
    isSubmittingCreateUser.value = true
    
    // 检查token是否存在
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录！')
      router.push({ name: 'Login' })
      return
    }
    
    // 构建请求数据
    const userPayload = {
      username: createUserForm.username.trim(),
      email: createUserForm.email.trim(),
      password: createUserForm.password,
      role: createUserForm.role,
      status: createUserForm.status
    }
    
    // 添加角色特定信息
    if (createUserForm.role === 'STUDENT') {
      userPayload.studentProfile = {
        studentNo: createUserForm.studentNo.trim(),
        grade: createUserForm.grade.trim() || undefined,
        major: createUserForm.major.trim() || undefined,
        className: createUserForm.className.trim() || undefined
      }
    } else if (createUserForm.role === 'TEACHER') {
      userPayload.teacherProfile = {
        teacherNo: createUserForm.teacherNo.trim(),
        department: createUserForm.department.trim() || undefined,
        title: createUserForm.title.trim() || undefined,
        subjects: createUserForm.subjects.trim() 
          ? createUserForm.subjects.split(',').map(s => s.trim()).filter(s => s) 
          : []
      }
    }
    
    // 构建批量创建请求
    const requestData = {
      users: [userPayload]
    }
    
    // 调用API
    console.log('发送创建用户请求:', requestData)
    await userAPI.createUser(requestData)
    
    // 成功处理
    alert('用户创建成功！')
    closeCreateUserModal()
    
    // 刷新用户列表
    await fetchUsers()
  } catch (error) {
    console.error('创建用户失败:', error)
    // 处理错误信息
    let errorMessage = '创建用户失败'
    if (error?.error?.message) {
      errorMessage = error.error.message
    } else if (error?.message) {
      errorMessage = error.message
    }
    // 特别处理认证错误
    if (error?.error?.includes('Unauthorized') || errorMessage.includes('Unauthorized')) {
      errorMessage = '认证失败，请重新登录！'
      router.push({ name: 'Login' })
    }
    alert(errorMessage)
  } finally {
    isSubmittingCreateUser.value = false
  }
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

// 关闭用户详情模态框
const closeUserModal = () => {
  userModalVisible.value = false
  currentUser.value = null
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    let response
    if (useMock.value) {
      response = await mockAPI.getUsers()
      users.value = (response.data || response).map(user => {
        const normalizedStatus = user.status === 'inactive'
          ? 'pending'
          : user.status === 'banned'
            ? 'suspended'
            : user.status
        return {
          ...user,
          status: normalizedStatus,
          registerTime: user.createdAt || user.registerTime,
          lastLogin: user.lastLogin || '未登录'
        }
      })
    } else {
      const params = {}
      if (searchQuery.value) {
        params.keyword = searchQuery.value
      }
      const backendStatusFilter = uiStatusToBackend(activeFilter.value)
      if (activeFilter.value !== 'all') {
        params.status = backendStatusFilter
      }
      response = await userAPI.getUsers(params)
      const payload = Array.isArray(response?.data) ? response.data : response
      console.log('获取到的用户数据:', payload)
      users.value = payload.map(mapApiUserToUi).filter(Boolean)
      console.log('映射后的用户列表:', users.value)
    }
  } catch (err) {
    error.value = err.message || '获取用户列表失败'
    console.error('获取用户列表错误:', err)
  } finally {
    loading.value = false
  }
}

// 更新用户
// 删除用户
const deleteUser = async () => {
  if (!currentUser.value) {
    return
  }
  if (!useMock.value) {
    alert('当前后台暂未开放删除用户接口。')
    return
  }
  if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) {
    return
  }
  try {
    await mockAPI.deleteUser(currentUser.value.id)
    const index = users.value.findIndex(u => u.id === currentUser.value.id)
    if (index > -1) {
      users.value.splice(index, 1)
    }
    closeUserModal()
    alert('用户已删除')
  } catch (err) {
    alert('删除失败: ' + (err.message || '未知错误'))
  }
}

// 审核通过
const approveUser = async () => {
  if (currentUser.value) {
    try {
      await changeUserStatus(currentUser.value.id, 'ACTIVE')
      closeReviewModal()
      alert('用户审核通过')
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  }
}

// 审核驳回
const rejectUser = async () => {
  if (currentUser.value) {
    try {
      const reason = reviewComment.value || '审核未通过'
      await changeUserStatus(currentUser.value.id, 'DISABLED', reason)
      closeReviewModal()
      alert('用户审核已驳回')
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  }
}

// 切换用户状态
const toggleUserStatus = async (userId) => {
  const userToUpdate = userId 
    ? users.value.find(u => u.id === userId)
    : currentUser.value
    
  if (!userToUpdate) {
    alert('未找到要更新的用户')
    return
  }
  
  if (!userToUpdate.id) {
    console.error('用户 ID 不存在:', userToUpdate)
    alert('用户 ID 无效')
    return
  }
  
  console.log('切换用户状态 - 用户信息:', userToUpdate)
  // 确定新状态：
  // - 如果当前是active，则切换为disabled
  // - 如果当前是disabled或pending，则切换为active
  const newBackendStatus = userToUpdate.status === 'active' ? 'DISABLED' : 'ACTIVE'
  const statusReason = userToUpdate.status === 'active' ? '管理员禁用账号' : undefined
  
  try {
    await changeUserStatus(userToUpdate.id, newBackendStatus, statusReason)
    const uiStatus = backendStatusToUi(newBackendStatus)
    alert(`用户状态已更新为：${getStatusText(uiStatus)}`)
  } catch (err) {
    console.error('切换用户状态失败:', err)
    const errorMsg = err.message || err.error || '操作失败，请稍后重试'
    alert('操作失败: ' + errorMsg)
  }
}

// 用户状态更新核心函数
const changeUserStatus = async (userId, backendStatus, reason = '') => {
  try {
    isChangingStatus.value = true
    // 确保 userId 是字符串格式
    const userIdStr = String(userId)
    console.log('更新用户状态 - userId:', userIdStr, 'status:', backendStatus)
    
    // 验证状态值是否有效
    const validStatuses = ['ACTIVE', 'DISABLED', 'LOCKED']
    if (!validStatuses.includes(backendStatus)) {
      alert(`无效的状态值: ${backendStatus}，请使用 ${validStatuses.join('、')}`)
      return false
    }
    
    // 验证非ACTIVE状态必须提供原因
    if (backendStatus !== 'ACTIVE') {
      if (!reason.trim()) {
        alert('非激活状态必须提供状态变更原因')
        return false
      }
      
      // 验证原因长度
      if (reason.trim().length < 5 || reason.trim().length > 200) {
        alert('状态变更原因长度必须在5-200个字符之间')
        return false
      }
    }
    
    const payload = {
      status: backendStatus,
      reason: backendStatus !== 'ACTIVE' ? reason.trim() : undefined
    }
    
    // 确认操作
    const statusText = {
      ACTIVE: '激活',
      DISABLED: '禁用',
      LOCKED: '待审核'
    }
    
    if (!confirm(`确定要将用户状态更新为「${statusText[backendStatus]}」吗？${backendStatus !== 'ACTIVE' ? `\n原因：${reason}` : ''}`)) {
      return false
    }
    
    if (useMock.value) {
      await mockAPI.updateUser(userIdStr, { status: backendStatusToUi(backendStatus) })
    } else {
      // 调用正确的接口：PUT /api/v1/admin/users/{userId}/status
      await userAPI.updateUserStatus(userIdStr, payload)
      // 更新成功后刷新列表
      await fetchUsers()
    }
    
    // 更新本地状态
    setUserStatusLocal(userIdStr, backendStatusToUi(backendStatus), reason.trim())
    
    // 显示成功消息
    console.log(`用户 ${userIdStr} 状态已更新为 ${statusText[backendStatus]}`)
    
    return true
  } catch (err) {
    handleApiError(err, '更新用户状态')
    return false
  } finally {
    isChangingStatus.value = false
  }
}

// 搜索
const handleSearch = () => {
  fetchUsers()
}

// 生命周期
onMounted(() => {
  fetchUsers()
})
</script>
  
  <style scoped>
    .error-message {
      background-color: #ffebee;
      color: #c62828;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #ffcdd2;
    }
    
    /* 加载状态样式 */
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* 创建用户相关样式 */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .role-specific-info {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }
    
    .role-specific-info h3 {
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .error-text {
      color: #c62828;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .form-input.error {
      border-color: #c62828;
    }

    /* 批量创建用户样式 */
    .bulk-create-form {
      margin: 20px 0;
    }

    .format-selector {
      display: flex;
      gap: 10px;
    }

    .format-btn {
      padding: 8px 16px;
      border: 1px solid #ccc;
      background-color: #fff;
      cursor: pointer;
      border-radius: 4px;
    }

    .format-btn.active {
      background-color: #2196f3;
      color: white;
      border-color: #2196f3;
    }

    .form-textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: monospace;
      resize: vertical;
    }

    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }

    .bulk-create-result {
      margin: 20px 0;
    }

    .result-message {
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 4px;
      background-color: #f5f5f5;
    }

    .result-message.success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .result-section {
      margin-bottom: 20px;
    }

    .result-section h3 {
      margin-bottom: 10px;
      font-size: 16px;
    }

    .result-table {
      width: 100%;
      border-collapse: collapse;
    }

    .result-table th, .result-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .result-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
  </style>

<template>
  <MainLayout>
    <main class="main-content">
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">用户管理</h1>
          <div class="header-actions">
            <button class="btn btn-success" @click="openCreateUserModal">创建用户</button>
            <button class="btn btn-primary" @click="openBulkCreateModal">批量创建用户</button>
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

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button class="btn btn-sm btn-primary" @click="fetchUsers">重试</button>
      </div>
      
      <div class="users-table-container" style="position: relative;">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
        
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
            <tr v-if="loading" class="loading-row">
              <td colspan="6" class="text-center">加载中...</td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0" class="empty-row">
              <td colspan="6" class="text-center">暂无用户数据</td>
            </tr>
            <tr v-else v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-info">
                  <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                  <div class="user-details">
                    <h4>{{ user.name }}</h4>
                    <p>{{ user.email }}</p>
                    <p v-if="user.phone" class="user-phone">{{ user.phone }}</p>
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
                    :disabled="isChangingStatus"
                  >
                    审核
                  </button>
                  <button 
                    v-else
                    class="btn btn-warning btn-sm" 
                    @click="toggleUserStatus(user.id)"
                    :disabled="isChangingStatus"
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
            <button class="btn btn-secondary" @click="closeReviewModal" :disabled="isChangingStatus">取消</button>
            <button class="btn btn-danger" @click="rejectUser" :disabled="isChangingStatus">驳回</button>
            <button class="btn btn-primary" @click="approveUser" :disabled="isChangingStatus">通过</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误消息会通过全局样式或CSS模块处理 -->
      
      <!-- 编辑用户模态框 -->
    <div v-if="editModalVisible" class="modal active" @click.self="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">编辑用户</h2>
          <button class="modal-close" @click="closeEditModal">&times;</button>
        </div>
        
        <div v-if="currentUser" class="user-edit-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="editForm.username"
              >
            </div>
            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input 
                type="email" 
                class="form-input" 
                v-model="editForm.email"
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">角色</label>
              <input 
                type="text" 
                class="form-input" 
                :value="getRoleText(editForm.role)"
                readonly
                title="角色暂不支持修改"
              >
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select class="form-input" v-model="editForm.status">
                <option value="active">已激活</option>
                <option value="pending">待审核</option>
                <option value="suspended">已禁用</option>
              </select>
            </div>
          </div>
          
          <div v-if="currentUser.role === 'student'" class="form-row">
            <div class="form-group">
              <label class="form-label">学号</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="editForm.studentNo"
                :readonly="true"
                title="学号暂不支持修改"
              >
            </div>
            <div class="form-group">
              <label class="form-label">专业</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="editForm.major"
                :readonly="true"
                title="专业暂不支持修改"
              >
            </div>
          </div>
          
          <div v-else-if="currentUser.role === 'teacher'" class="form-row">
            <div class="form-group">
              <label class="form-label">工号</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="editForm.employeeId"
                :readonly="true"
                title="工号暂不支持修改"
              >
            </div>
            <div class="form-group">
              <label class="form-label">部门</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="editForm.department"
                :readonly="true"
                title="部门暂不支持修改"
              >
            </div>
          </div>
          
          <div class="info-notice">
            <p>📝 提示：可以修改用户名和邮箱信息。</p>
            <p>修改状态时，非激活状态需要提供状态变更原因。</p>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeEditModal" :disabled="isSubmittingEdit">取消</button>
          <button type="button" class="btn btn-primary" @click="saveEdit" :disabled="isSubmittingEdit">
            {{ isSubmittingEdit ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 批量创建用户模态框 -->
    <div v-if="bulkCreateModalVisible" class="modal active" @click.self="closeBulkCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">批量创建用户</h2>
          <button class="modal-close" @click="closeBulkCreateModal">&times;</button>
        </div>
        
        <div class="bulk-create-form">
          <!-- 格式选择 -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">格式选择</label>
              <div class="format-selector">
                <button 
                  class="format-btn" 
                  :class="{ active: bulkCreateFormat === 'json' }"
                  @click="bulkCreateFormat = 'json'"
                >
                  JSON
                </button>
                <button 
                  class="format-btn" 
                  :class="{ active: bulkCreateFormat === 'csv' }"
                  @click="bulkCreateFormat = 'csv'"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>
          
          <!-- JSON格式输入 -->
          <div v-if="bulkCreateFormat === 'json'" class="form-row">
            <div class="form-group">
              <label class="form-label">JSON内容</label>
              <textarea 
                class="form-textarea" 
                v-model="bulkCreateJsonContent"
                placeholder='请输入JSON格式的用户数据，例如：{"users": [{"username": "student1", "email": "student1@example.com", "password": "Password123", "role": "STUDENT", "status": "ACTIVE", "studentProfile": {"studentNo": "2025001", "grade": "2025", "major": "软件工程", "className": "软工2501"}}]}'
                rows="10"
              ></textarea>
            </div>
          </div>
          
          <!-- CSV格式输入 -->
          <div v-else class="form-row">
            <div class="form-group">
              <label class="form-label">CSV上传</label>
              <input 
                type="file" 
                accept=".csv" 
                class="form-input" 
                @change="handleFileUpload"
              >
              <p class="help-text">支持的字段：username, email, password, role, status, statusReason, studentNo, grade, major, className, teacherNo, department, title, subjects</p>
            </div>
            <div class="form-group">
              <label class="form-label">CSV内容</label>
              <textarea 
                class="form-textarea" 
                v-model="bulkCreateCsvContent"
                placeholder='username,email,password,role,status,studentNo,grade,major,className
student1,student1@example.com,Password123,STUDENT,ACTIVE,2025001,2025,软件工程,软工2501
student2,student2@example.com,Password123,STUDENT,ACTIVE,2025002,2025,软件工程,软工2501
teacher1,teacher1@example.com,Teacher123,TEACHER,ACTIVE,T2025001,计算机学院,讲师,程序设计;算法分析'
                rows="10"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeBulkCreateModal">取消</button>
          <button 
            type="button" 
            class="btn btn-success" 
            @click="bulkCreateUsers"
            :disabled="isSubmittingBulkCreate"
          >
            {{ isSubmittingBulkCreate ? '创建中...' : '批量创建' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 批量创建结果模态框 -->
    <div v-if="bulkCreateResultVisible" class="modal active" @click.self="bulkCreateResultVisible = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">批量创建结果</h2>
          <button class="modal-close" @click="bulkCreateResultVisible = false">&times;</button>
        </div>
        
        <div class="bulk-create-result">
          <div class="result-message" :class="{ success: bulkCreateResult.success }">
            {{ bulkCreateResult.message }}
          </div>
          
          <!-- 成功创建的用户 -->
          <div v-if="bulkCreateResult.created.length > 0" class="result-section">
            <h3>成功创建的用户</h3>
            <table class="result-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in bulkCreateResult.created" :key="user.id">
                  <td>{{ user.username }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ getRoleText(user.role) }}</td>
                  <td>{{ getStatusText(user.status) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- 创建失败的用户 -->
          <div v-if="bulkCreateResult.errors.length > 0" class="result-section">
            <h3>创建失败的用户</h3>
            <table class="result-table">
              <thead>
                <tr>
                  <th>行号</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>错误信息</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(error, index) in bulkCreateResult.errors" :key="index">
                  <td>{{ error.index + 1 }}</td>
                  <td>{{ error.username }}</td>
                  <td>{{ error.email }}</td>
                  <td class="error-message">{{ error.message }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="bulkCreateResultVisible = false"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
    
    <!-- 创建用户模态框 -->
    <div v-if="createUserModalVisible" class="modal active" @click.self="closeCreateUserModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">创建用户</h2>
          <button class="modal-close" @click="closeCreateUserModal">&times;</button>
        </div>
        
        <div class="user-create-form">
          <div class="form-row">
              <div class="form-group">
                <label class="form-label">用户名 *</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.username"
                  :class="{ 'error': createUserFormErrors.username }"
                >
                <div v-if="createUserFormErrors.username" class="error-message">{{ createUserFormErrors.username }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">邮箱 *</label>
                <input 
                  type="email" 
                  class="form-input" 
                  v-model="createUserForm.email"
                  :class="{ 'error': createUserFormErrors.email }"
                >
                <div v-if="createUserFormErrors.email" class="error-message">{{ createUserFormErrors.email }}</div>
              </div>
            </div>
          
          <div class="form-row">
              <div class="form-group">
                <label class="form-label">密码 *</label>
                <input 
                  type="password" 
                  class="form-input" 
                  v-model="createUserForm.password"
                  :class="{ 'error': createUserFormErrors.password }"
                  placeholder="至少8个字符"
                >
                <div v-if="createUserFormErrors.password" class="error-message">{{ createUserFormErrors.password }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">确认密码 *</label>
                <input 
                  type="password" 
                  class="form-input" 
                  v-model="createUserForm.confirmPassword"
                  :class="{ 'error': createUserFormErrors.confirmPassword }"
                >
                <div v-if="createUserFormErrors.confirmPassword" class="error-message">{{ createUserFormErrors.confirmPassword }}</div>
              </div>
            </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">角色 *</label>
              <select 
                class="form-input" 
                v-model="createUserForm.role"
                :class="{ 'error': createUserFormErrors.role }"
              >
                <option value="STUDENT">学生</option>
                <option value="TEACHER">教师</option>
                <option value="ADMIN">管理员</option>
              </select>
              <div v-if="createUserFormErrors.role" class="error-text">{{ createUserFormErrors.role }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select 
                class="form-input" 
                v-model="createUserForm.status"
              >
                <option value="ACTIVE">已激活</option>
                <option value="PENDING">待审核</option>
                <option value="SUSPENDED">已禁用</option>
              </select>
            </div>
          </div>
          
          <!-- 学生信息 -->
          <div v-if="createUserForm.role === 'STUDENT'" class="role-specific-info">
            <h3>学生信息</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">学号 <span class="required">*</span></label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.studentNo"
                  :class="{ 'error': createUserFormErrors.studentNo }"
                >
                <div v-if="createUserFormErrors.studentNo" class="error-message">{{ createUserFormErrors.studentNo }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">年级</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.grade"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">专业</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.major"
                >
              </div>
              <div class="form-group">
                <label class="form-label">班级</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.className"
                >
              </div>
            </div>
          </div>
          
          <!-- 教师信息 -->
          <div v-else-if="createUserForm.role === 'TEACHER'" class="role-specific-info">
            <h3>教师信息</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">工号 <span class="required">*</span></label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.teacherNo"
                  :class="{ 'error': createUserFormErrors.teacherNo }"
                >
                <div v-if="createUserFormErrors.teacherNo" class="error-message">{{ createUserFormErrors.teacherNo }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">部门</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.department"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">职称</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.title"
                >
              </div>
              <div class="form-group">
                <label class="form-label">教授科目（多个科目用逗号分隔）</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="createUserForm.subjects"
                  placeholder="如：数学,英语,物理"
                >
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeCreateUserModal">取消</button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="createUser"
            :disabled="isSubmittingCreateUser"
          >
            {{ isSubmittingCreateUser ? '创建中...' : '创建' }}
          </button>
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
  
  .required {
    color: #ff4d4f;
    margin-left: 4px;
  }
  
  .error-message {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.5;
  }
  
  .form-input.error {
    border-color: #ff4d4f;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

/* 响应式设计 - 平板端 */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .search-bar {
    display: flex;
    gap: 8px;
  }
  
  .search-input {
    width: 200px;
  }
  
  .filter-tabs {
    justify-content: flex-start;
    overflow-x: auto;
  }
  
  .filter-tab {
    white-space: nowrap;
  }
  
  .action-buttons {
    gap: 4px;
  }
  
  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* 响应式设计 - 小平板端 */
@media (max-width: 896px) {
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
  
  /* 表格响应式 */
  .users-table-container {
    overflow-x: auto;
  }
  
  .users-table {
    min-width: 700px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}

/* 响应式设计 - 移动端 */
@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .filter-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 8px;
    padding: 0 16px;
  }
  
  .filter-tab {
    font-size: 14px;
    padding: 8px 12px;
  }
  
  .page-content {
    padding: 16px;
  }
  
  /* 表格移动端优化 */
  .users-table-container {
    overflow-x: auto;
  }
  
  .users-table {
    min-width: 700px;
  }
  
  /* 操作按钮优化 */
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .btn-sm {
    width: 100%;
    padding: 8px 12px;
    font-size: 12px;
  }
  
  /* 模态框响应式 */
  .modal-content {
    width: 95%;
    margin: 10px;
    padding: 24px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .btn {
    width: 100%;
  }
}

/* 响应式设计 - 小屏移动端 */
@media (max-width: 480px) {
  .modal-content {
    padding: 16px;
  }
  
  .modal-title {
    font-size: 16px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-input {
    padding: 10px 14px;
    font-size: 14px;
  }
}

.info-notice {
  background: rgba(255, 149, 0, 0.1);
  border: 1px solid rgba(255, 149, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
  margin-bottom: 24px;
}

.info-notice p {
  margin: 8px 0;
  font-size: 14px;
  color: #ff9500;
  line-height: 1.5;
}

.info-notice p:first-child {
  margin-top: 0;
  font-weight: 500;
}

.info-notice p:last-child {
  margin-bottom: 0;
}
</style>
