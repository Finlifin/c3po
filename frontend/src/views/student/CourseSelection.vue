<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useStudentAuthStore } from '../../stores/auth_student'
import { studentApi } from '../../api/student'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageContainer from '../../components/layout/PageContainer.vue'
import ContentGrid from '../../components/layout/ContentGrid.vue'

const authStore = useStudentAuthStore()

// 课程数据类型定义
interface Teacher {
  id: string
  username: string
  department: string | null
  title: string | null
}

interface EnrollmentStatus {
  enrolled: boolean
  canEnroll: boolean
  reason: string | null
}

interface CourseResponse {
  id: string
  name: string
  semester: string | null
  credit: number
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  enrollLimit: number
  enrolledCount: number
  assignments: number
  modules: number
  teacher: Teacher
  enrollmentStatus: EnrollmentStatus
  createdAt: string
  updatedAt: string
}

// 状态变量
const courses = ref<CourseResponse[]>([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
// 筛选条件变量
const semester = ref<string>('')
const credit = ref<number | ''>('')
const department = ref<string>('')

// 获取课程列表
const fetchCourses = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      semester: semester.value,
      credit: credit.value,
      department: department.value,
      sort: 'createdAt,desc'
    }
    
    const response = await studentApi.getAvailableCourses(params)
    
    courses.value = response.data.data
    // 处理分页信息
    total.value = response.data.meta.total
    
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取课程列表失败'
    console.error('Failed to fetch courses:', err)
  } finally {
    loading.value = false
  }
}

// 选课
const enrollCourse = async (course: CourseResponse) => {
  try {
    await ElMessageBox.confirm(
      `确定选择"${course.name}"吗？`,
      '选课确认',
      {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }
    )
    
    await studentApi.enrollCourse(course.id)
    
    // 更新课程列表
    await fetchCourses()
    ElMessage.success('选课成功')
    
  } catch (err: any) {
    if (err === 'cancel' || err.name === 'ElMessageBoxCancel') {
      return // 用户取消操作
    }
    const errorMsg = err.response?.data?.message || '选课失败'
    console.error('Failed to enroll course:', err)
    ElMessage.error(errorMsg)
  }
}

// 退课
const dropCourse = async (course: CourseResponse) => {
  try {
    await ElMessageBox.confirm(
      `确定退课"${course.name}"吗？`,
      '退课确认',
      {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }
    )
    
    await studentApi.dropCourse(course.id)
    
    // 更新课程列表
    await fetchCourses()
    ElMessage.success('退课成功')
    
  } catch (err: any) {
    if (err === 'cancel' || err.name === 'ElMessageBoxCancel') {
      return // 用户取消操作
    }
    const errorMsg = err.response?.data?.message || '退课失败'
    console.error('Failed to drop course:', err)
    ElMessage.error(errorMsg)
  }
}

// 页面加载时初始化数据
onMounted(async () => {
  await fetchCourses()
})

// 处理课程数据
const processedCourses = computed(() => {
  return courses.value.map(course => {
    return {
      ...course,
      isEnrolled: course.enrollmentStatus.enrolled,
      canEnroll: course.enrollmentStatus.canEnroll,
      enrollReason: course.enrollmentStatus.reason
    }
  })
})

// 搜索和筛选
const handleSearch = () => {
  page.value = 1
  fetchCourses()
}

// 页码变更
const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchCourses()
}
</script>

<template>
  <PageContainer>
    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchKeyword"
          placeholder="搜索课程名称"
          @input="handleSearch"
        >
      </div>
      <div class="filter-options">
        <input 
          type="text" 
          v-model="semester"
          placeholder="按学期筛选"
          @input="handleSearch"
        >
        <input 
          type="number" 
          v-model="credit"
          placeholder="按学分筛选"
          @input="handleSearch"
        >
        <input 
          type="text" 
          v-model="department"
          placeholder="按教师院系筛选"
          @input="handleSearch"
        >
      </div>
    </div>
    
    <!-- 课程列表 -->
    <div class="courses-section">
      <div class="section-title">
        <h2>课程列表</h2>
        <span class="total-count">共 {{ total }} 门课程</span>
      </div>
      
      <!-- 桌面端：表格视图 -->
      <div class="table-view">
        <el-table 
          :data="processedCourses" 
          border 
          stripe 
          style="width: 100%" 
          v-loading="loading"
        >
          <el-table-column prop="name" label="课程名称" min-width="200" align="left"></el-table-column>
          <el-table-column prop="semester" label="学期" min-width="100"></el-table-column>
          <el-table-column prop="credit" label="学分" width="80"></el-table-column>
          <el-table-column label="教师用户名" min-width="120">
            <template #default="{ row }">
              {{ row.teacher.username }}
            </template>
          </el-table-column>
          <el-table-column label="教师院系" min-width="120">
            <template #default="{ row }">
              {{ row.teacher.department || '未设置' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="课程状态">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === 'PUBLISHED' ? 'success' : 
                      row.status === 'DRAFT' ? 'warning' : 
                      row.status === 'PENDING_REVIEW' ? 'info' : 'danger'"
              >
                {{ row.status === 'PUBLISHED' ? '已发布' : 
                   row.status === 'DRAFT' ? '草稿' : 
                   row.status === 'PENDING_REVIEW' ? '待审核' : '已归档' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="enrolledCount" label="选课人数" width="120">
            <template #default="{ row }">
              {{ row.enrolledCount }}/{{ row.enrollLimit }}
            </template>
          </el-table-column>
          <el-table-column prop="modules" label="模块数" width="80"></el-table-column>
          <el-table-column prop="assignments" label="作业数" width="80"></el-table-column>
          <el-table-column prop="isEnrolled" label="选课状态">
            <template #default="{ row }">
              <el-tag :type="row.isEnrolled ? 'success' : 'info'">
                {{ row.isEnrolled ? '已选' : '未选' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                v-if="row.isEnrolled" 
                type="danger" 
                size="small" 
                @click="dropCourse(row)"
              >
                退课
              </el-button>
              <el-button 
                v-else 
                type="success" 
                size="small" 
                :disabled="!row.canEnroll"
                @click="enrollCourse(row)"
              >
                选课
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 移动端：卡片视图 -->
      <div class="card-view">
        <div v-loading="loading">
          <el-empty v-if="!loading && processedCourses.length === 0" description="暂无课程" />
          <ContentGrid v-else min-width="300px" gap="md" :columns="{ xs: 1, sm: 1, md: 2, lg: 3 }">
            <el-card
              v-for="course in processedCourses"
              :key="course.id"
              class="course-card"
              shadow="hover"
            >
              <div class="course-card-header">
                <h3 class="course-name">{{ course.name }}</h3>
                <el-tag 
                  :type="course.status === 'PUBLISHED' ? 'success' : 
                        course.status === 'DRAFT' ? 'warning' : 
                        course.status === 'PENDING_REVIEW' ? 'info' : 'danger'"
                  size="small"
                >
                  {{ course.status === 'PUBLISHED' ? '已发布' : 
                     course.status === 'DRAFT' ? '草稿' : 
                     course.status === 'PENDING_REVIEW' ? '待审核' : '已归档' }}
                </el-tag>
              </div>
              
              <div class="course-card-info">
                <div class="info-row">
                  <span class="info-label">学期：</span>
                  <span class="info-value">{{ course.semester }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">学分：</span>
                  <span class="info-value">{{ course.credit }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">教师用户名：</span>
                  <span class="info-value">{{ course.teacher.username }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">教师院系：</span>
                  <span class="info-value">{{ course.teacher.department || '未设置' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">选课人数：</span>
                  <span class="info-value">{{ course.enrolledCount }}/{{ course.enrollLimit }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">模块数：</span>
                  <span class="info-value">{{ course.modules }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">作业数：</span>
                  <span class="info-value">{{ course.assignments }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">选课状态：</span>
                  <el-tag :type="course.isEnrolled ? 'success' : 'info'" size="small">
                    {{ course.isEnrolled ? '已选' : '未选' }}
                  </el-tag>
                </div>
                <div v-if="!course.canEnroll && course.enrollReason" class="info-row">
                  <span class="info-label">无法选课原因：</span>
                  <span class="info-value error">{{ course.enrollReason }}</span>
                </div>
              </div>
              
              <div class="course-card-actions">
                <el-button 
                  v-if="course.isEnrolled" 
                  type="danger" 
                  size="small" 
                  @click="dropCourse(course)"
                  style="width: 100%"
                >
                  退课
                </el-button>
                <el-button 
                  v-else 
                  type="success" 
                  size="small" 
                  :disabled="!course.canEnroll"
                  @click="enrollCourse(course)"
                  style="width: 100%"
                >
                  选课
                </el-button>
              </div>
            </el-card>
          </ContentGrid>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination">
        <button 
          class="page-btn" 
          :disabled="page <= 1"
          @click="handlePageChange(page - 1)"
        >
          上一页
        </button>
        <span class="page-info">第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
        <button 
          class="page-btn" 
          :disabled="page * pageSize >= total"
          @click="handlePageChange(page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped>
/* 搜索和筛选 */
.filter-section {
  background-color: var(--bg-primary);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-8);
  display: flex;
  gap: var(--space-4);
  align-items: center;
  flex-wrap: wrap;
}

.search-box input {
  padding: var(--space-3) var(--space-5);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  width: 300px;
  outline: none;
  transition: all var(--transition-fast);
}

.search-box input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-options {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  flex-wrap: wrap;
}

.filter-options input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  outline: none;
  transition: all var(--transition-fast);
}

.filter-options input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 课程列表 */
.courses-section {
  background-color: var(--bg-primary);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-8);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.section-title h2 {
  color: var(--text-primary);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.total-count {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

/* 桌面端表格视图 */
.table-view {
  display: block;
}

/* 移动端卡片视图 */
.card-view {
  display: none;
}

.course-card {
  transition: all var(--transition-base);
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  gap: var(--space-2);
}

.course-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.course-card-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.info-value.error {
  color: var(--danger);
}

.course-card-actions {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-8);
  flex-wrap: wrap;
}

.page-btn {
  padding: var(--space-3) var(--space-5);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .table-view {
    display: none;
  }
  
  .card-view {
    display: block;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filter-options {
    width: 100%;
  }
  
  .filter-options input {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .courses-section {
    padding: var(--space-5);
  }
  
  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .section-title h2 {
    font-size: 1.5rem;
  }
  
  .filter-section {
    padding: var(--space-4);
  }
  
  .pagination {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .page-btn {
    width: 100%;
  }
  
  .page-info {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .courses-section {
    padding: var(--space-4);
  }
  
  .section-title h2 {
    font-size: 1.25rem;
  }
  
  .course-name {
    font-size: 1.1rem;
  }
}
</style>