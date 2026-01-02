<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentAuthStore } from '../../stores/auth_student'
import { studentApi } from '../../api/student'
import PageContainer from '../../components/layout/PageContainer.vue'
import TodoList from '../../components/common/TodoList.vue'
import { ElDrawer, ElButton, ElMessage } from 'element-plus'
import request from '../../utils/request'

const router = useRouter()
const authStore = useStudentAuthStore()

// User data
const user = computed(() => authStore.user)

// Todo data
const todos = ref<any[]>([])
const loading = ref(false)
const error = ref('')

// AI Review Reminder data
const aiDrawerVisible = ref(false)
const aiLoading = ref(false)
const aiResponse = ref<any>(null)

// Fetch todos
const fetchTodos = async () => {
  try {
    loading.value = true
    const response = await studentApi.getTodos()
    todos.value = response.data.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取待办事项失败'
  } finally {
    loading.value = false
  }
}

// Send AI review reminder request
const sendAiRequest = async () => {
  try {
    aiLoading.value = true
    const response = await request.get('http://10.70.141.134:8080/api/v1/assistant/review-reminder')
    aiResponse.value = response.data
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '获取复习提醒失败')
  } finally {
    aiLoading.value = false
  }
}

// Open AI drawer
const openAiDrawer = () => {
  aiDrawerVisible.value = true
  sendAiRequest()
}

// Load data on mount
onMounted(async () => {
  if (!user.value) {
    await authStore.fetchUserInfo()
  }
  await fetchTodos()
})
</script>

<template>
  <PageContainer>
    <!-- Welcome Section -->
    <div class="welcome-section">
      <h2>欢迎回来，{{ user?.username }}同学</h2>
      <p>这是您的学生仪表板，您可以在这里查看课程、作业和成绩。</p>
      <el-button 
        type="primary" 
        @click="openAiDrawer"
        class="ai-review-btn"
        size="large"
      >
        AI复习提醒和学习计划
      </el-button>
    </div>
    
    <!-- 我的待办事项 -->
    <TodoList
      title="我的待办事项"
      :todos="todos"
      :loading="loading"
      :error="error"
      @todo-click="(todo) => router.push(`/student/assignments/${todo.id}/submit`)"
    />

    <!-- AI Review Reminder Drawer -->
    <el-drawer
      v-model="aiDrawerVisible"
      title="AI复习提醒和学习计划"
      direction="rtl"
      size="50%"
    >
      <div v-if="aiLoading" class="ai-loading">
        <p>正在生成复习提醒和学习计划...</p>
      </div>
      <div v-else-if="aiResponse" class="ai-response">
        <div class="ai-answer">
          <h3>复习提醒和学习计划</h3>
          <div class="ai-content" v-html="aiResponse.data.answer.replace(/\n/g, '<br>')"></div>
        </div>
        <div v-if="aiResponse.data.suggestions && aiResponse.data.suggestions.length > 0" class="ai-suggestions">
          <h3>学习建议</h3>
          <ul>
            <li v-for="(suggestion, index) in aiResponse.data.suggestions" :key="index">
              {{ suggestion.title }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else class="ai-empty">
        <p>暂无复习提醒数据</p>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<style scoped>
.welcome-section {
  background-color: var(--bg-primary);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.welcome-section h2 {
  color: var(--text-primary);
  font-size: 1.8rem;
  margin-bottom: var(--space-2);
  margin-top: 0;
}

.welcome-section p {
  color: var(--text-secondary);
  font-size: var(--text-base);
  margin: 0 0 var(--space-4) 0;
}

.ai-review-btn {
  margin-top: var(--space-4);
}

/* AI Drawer Styles */
.ai-loading {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-secondary);
}

.ai-response {
  padding: var(--space-2);
}

.ai-answer h3,
.ai-suggestions h3 {
  color: var(--text-primary);
  font-size: 1.2rem;
  margin-bottom: var(--space-2);
  margin-top: var(--space-4);
}

.ai-answer h3:first-child,
.ai-suggestions h3:first-child {
  margin-top: 0;
}

.ai-content {
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.ai-suggestions ul {
  list-style-type: disc;
  padding-left: var(--space-6);
}

.ai-suggestions li {
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.ai-empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-secondary);
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-md);
}

:deep(.el-drawer__header) {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--space-3);
}

:deep(.el-drawer__body) {
  padding-top: var(--space-4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .welcome-section {
    padding: var(--space-5);
  }

  .welcome-section h2 {
    font-size: 1.5rem;
  }

  .welcome-section p {
    font-size: var(--text-sm);
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: var(--space-4);
  }

  .welcome-section h2 {
    font-size: 1.25rem;
  }
}
</style>