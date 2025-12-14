<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { studentApi } from '../../api/student'
import PageContainer from '../../components/layout/PageContainer.vue'
import TodoList from '../../components/common/TodoList.vue'

const router = useRouter()
const authStore = useAuthStore()

// User data
const user = computed(() => authStore.user)

// Todo data
const todos = ref<any[]>([])
const loading = ref(false)
const error = ref('')

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
    </div>
    
    <!-- 我的待办事项 -->
    <TodoList
      title="我的待办事项"
      :todos="todos"
      :loading="loading"
      :error="error"
      @todo-click="(todo) => router.push(`/student/assignments/${todo.id}/submit`)"
    />
  </PageContainer>
</template>

<style scoped>
.welcome-section {
  background-color: var(--bg-primary);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-8);
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
  margin: 0;
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-md);
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