<script setup>
import { ref, computed } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'

// 课程数据
const courses = ref([
  {
    id: 1,
    name: '人工智能基础',
    teacher: '王老师',
    semester: '春季学期',
    applyTime: '2025-03-01',
    status: 'pending'
  },
  {
    id: 2,
    name: '数据可视化',
    teacher: '李教授',
    semester: '秋季学期',
    applyTime: '2025-03-02',
    status: 'approved'
  },
  {
    id: 3,
    name: '云计算导论',
    teacher: '陈老师',
    semester: '春季学期',
    applyTime: '2025-03-03',
    status: 'rejected'
  }
])

// 筛选条件
const keyword = ref('')
const statusFilter = ref('全部')
const semesterFilter = ref('全部')

// 选中的课程ID
const selectedCourses = ref([])

// 获取状态文本和类名
const getStatusInfo = (status) => {
  const statusMap = {
    'pending': { text: '待审核', class: 'pending' },
    'approved': { text: '已通过', class: 'approved' },
    'rejected': { text: '已驳回', class: 'rejected' }
  }
  return statusMap[status] || { text: status, class: '' }
}

// 计算过滤后的课程列表
const filteredCourses = computed(() => {
  let result = [...courses.value]

  // 关键词筛选
  if (keyword.value) {
    const query = keyword.value.toLowerCase()
    result = result.filter(course =>
      course.name.toLowerCase().includes(query) ||
      course.teacher.toLowerCase().includes(query)
    )
  }

  // 状态筛选
  if (statusFilter.value !== '全部') {
    const statusMap = {
      '待审核': 'pending',
      '已通过': 'approved',
      '已驳回': 'rejected'
    }
    const status = statusMap[statusFilter.value]
    if (status) {
      result = result.filter(course => course.status === status)
    }
  }

  // 学期筛选
  if (semesterFilter.value !== '全部') {
    result = result.filter(course => course.semester === semesterFilter.value)
  }

  return result
})

// 切换选中状态
const toggleSelect = (courseId) => {
  const index = selectedCourses.value.indexOf(courseId)
  if (index > -1) {
    selectedCourses.value.splice(index, 1)
  } else {
    selectedCourses.value.push(courseId)
  }
}

// 全选/取消全选
const toggleSelectAll = (event) => {
  if (event.target.checked) {
    selectedCourses.value = filteredCourses.value.map(c => c.id)
  } else {
    selectedCourses.value = []
  }
}

// 审核课程
const reviewCourse = (courseId, approve) => {
  const course = courses.value.find(c => c.id === courseId)
  if (course) {
    course.status = approve ? 'approved' : 'rejected'
    alert(approve ? '课程审核通过' : '课程审核已驳回')
  }
}

// 撤回课程
const withdrawCourse = (courseId) => {
  const course = courses.value.find(c => c.id === courseId)
  if (course) {
    course.status = 'pending'
    alert('课程已撤回')
  }
}

// 重新提交
const resubmitCourse = (courseId) => {
  const course = courses.value.find(c => c.id === courseId)
  if (course) {
    course.status = 'pending'
    alert('课程已重新提交')
  }
}

// 批量通过
const batchApprove = () => {
  if (selectedCourses.value.length === 0) {
    alert('请先选择要操作的课程')
    return
  }
  selectedCourses.value.forEach(id => {
    const course = courses.value.find(c => c.id === id)
    if (course) {
      course.status = 'approved'
    }
  })
  selectedCourses.value = []
  alert('批量审核通过完成')
}

// 批量驳回
const batchReject = () => {
  if (selectedCourses.value.length === 0) {
    alert('请先选择要操作的课程')
    return
  }
  selectedCourses.value.forEach(id => {
    const course = courses.value.find(c => c.id === id)
    if (course) {
      course.status = 'rejected'
    }
  })
  selectedCourses.value = []
  alert('批量审核驳回完成')
}

// 查询
const handleSearch = () => {
  // 查询逻辑已在 computed 中处理
}
</script>

<template>
  <MainLayout>
    <main class="main-content">
      <header class="header">
        <div class="header-content">
          <h1>课程审核</h1>
          <div class="actions">
            <button class="btn btn-secondary">导出列表</button>
            <button class="btn btn-primary">新建课程</button>
          </div>
        </div>
      </header>

      <section class="card">
        <h2 class="section-title">筛选条件</h2>
        <div class="filters">
          <div>
            <label class="form-label">关键词</label>
            <input 
              class="form-input" 
              placeholder="课程名/教师名"
              v-model="keyword"
            >
          </div>
          <div>
            <label class="form-label">状态</label>
            <select class="form-input form-select" v-model="statusFilter">
              <option>全部</option>
              <option>待审核</option>
              <option>已通过</option>
              <option>已驳回</option>
            </select>
          </div>
          <div>
            <label class="form-label">学期</label>
            <select class="form-input form-select" v-model="semesterFilter">
              <option>全部</option>
              <option>春季学期</option>
              <option>秋季学期</option>
            </select>
          </div>
          <div class="flex items-center" style="margin-top: auto;">
            <button class="btn btn-primary" @click="handleSearch">查询</button>
          </div>
        </div>
      </section>

      <section class="card table-card">
        <div class="card-header">
          <div class="card-title">课程列表</div>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" @click="batchApprove">批量通过</button>
            <button class="btn btn-secondary btn-sm" @click="batchReject">批量驳回</button>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">
                  <input 
                    type="checkbox"
                    @change="toggleSelectAll"
                    :checked="selectedCourses.length === filteredCourses.length && filteredCourses.length > 0"
                  >
                </th>
                <th>课程名</th>
                <th>教师</th>
                <th>学期</th>
                <th>申请时间</th>
                <th>状态</th>
                <th style="width: 220px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in filteredCourses" :key="course.id">
                <td>
                  <input 
                    type="checkbox"
                    :checked="selectedCourses.includes(course.id)"
                    @change="toggleSelect(course.id)"
                  >
                </td>
                <td>{{ course.name }}</td>
                <td>{{ course.teacher }}</td>
                <td>{{ course.semester }}</td>
                <td>{{ course.applyTime }}</td>
                <td>
                  <span class="status-badge" :class="getStatusInfo(course.status).class">
                    {{ getStatusInfo(course.status).text }}
                  </span>
                </td>
                <td class="actions">
                  <!-- 待审核状态 -->
                  <template v-if="course.status === 'pending'">
                    <button class="btn btn-primary btn-sm" @click="reviewCourse(course.id, true)">通过</button>
                    <button class="btn btn-danger btn-sm" @click="reviewCourse(course.id, false)">驳回</button>
                    <a class="btn btn-secondary btn-sm" href="#">详情</a>
                  </template>
                  <!-- 已通过状态 -->
                  <template v-else-if="course.status === 'approved'">
                    <button class="btn btn-secondary btn-sm" @click="withdrawCourse(course.id)">撤回</button>
                    <a class="btn btn-secondary btn-sm" href="#">详情</a>
                  </template>
                  <!-- 已驳回状态 -->
                  <template v-else-if="course.status === 'rejected'">
                    <button class="btn btn-primary btn-sm" @click="resubmitCourse(course.id)">重新提交</button>
                    <a class="btn btn-secondary btn-sm" href="#">详情</a>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </MainLayout>
</template>

<style scoped>
.main-content {
  padding: 24px;
  min-height: 100vh;
}

.header {
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

.header-content h1 {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 24px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 0;
}

.flex.items-center {
  display: flex;
  align-items: center;
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

.form-input::placeholder {
  color: #86868b;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 16px;
  border: 1px solid #d1d1d6;
}

.table-card {
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d1d1d6;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 16px;
  border-bottom: 1px solid #d1d1d6;
  text-align: left;
}

th {
  color: #86868b;
  font-weight: 600;
  background: #f2f2f7;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.status-badge.approved {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.status-badge.rejected {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.actions {
  display: flex;
  gap: 8px;
  opacity: 1 !important;
  visibility: visible !important;
}

/* 按钮样式 */
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

  .filters {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
