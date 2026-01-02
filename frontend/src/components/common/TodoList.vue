<template>
  <div class="todo-list-section">
    <h3 class="section-title">{{ title }}</h3>
    
    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>
    
    <el-empty v-else-if="todos.length === 0" :description="emptyText" />
    
    <ContentGrid v-else :min-width="minWidth" gap="md" :columns="{ xs: 1, sm: 1, md: 2, lg: 3 }">
      <TodoCard
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @click="handleTodoClick"
      />
    </ContentGrid>
  </div>
</template>

<script setup lang="ts">
import ContentGrid from '../layout/ContentGrid.vue'
import TodoCard from './TodoCard.vue'

interface Todo {
  id: string
  title: string
  description?: string
  status: 'pending' | 'completed' | 'submitted'
  type?: string
  dueAt?: string
}

interface Props {
  title?: string
  todos: Todo[]
  loading?: boolean
  error?: string
  emptyText?: string
  minWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '我的待办事项',
  loading: false,
  error: '',
  emptyText: '暂无待办事项',
  minWidth: '280px'
})

const emit = defineEmits<{
  todoClick: [todo: Todo]
}>()

const handleTodoClick = (todo: Todo) => {
  emit('todoClick', todo)
}
</script>

<style scoped>
.todo-list-section {
  background-color: var(--bg-primary);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-8);
}

.section-title {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 var(--space-5) 0;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--gray-200);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--text-secondary);
  font-size: var(--text-base);
}

.error-state {
  color: var(--error);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .todo-list-section {
    padding: var(--space-5);
    margin-bottom: var(--space-6);
  }

  .section-title {
    font-size: 1.25rem;
    margin-bottom: var(--space-4);
  }

  .loading-state,
  .error-state {
    padding: var(--space-8) var(--space-4);
    font-size: var(--text-sm);
  }
}

@media (max-width: 480px) {
  .todo-list-section {
    padding: var(--space-4);
  }

  .section-title {
    font-size: 1.125rem;
  }
}
</style>
