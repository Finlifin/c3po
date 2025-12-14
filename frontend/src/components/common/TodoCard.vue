<template>
  <el-card
    :class="['todo-card', todo.status]"
    shadow="hover"
    @click="handleClick"
  >
    <div class="todo-header">
      <h4 class="todo-title">{{ todo.title }}</h4>
      <el-tag :type="todo.status === 'pending' ? 'warning' : 'success'" size="small">
        {{ todo.status === 'pending' ? '待完成' : '已完成' }}
      </el-tag>
    </div>
    <div class="todo-content">
      <p v-if="todo.description" class="todo-description">{{ todo.description }}</p>
      <div class="todo-meta">
        <el-tag v-if="todo.type" size="small" effect="plain">{{ todo.type }}</el-tag>
        <span v-if="todo.dueAt" class="todo-due">
          <el-icon><Timer /></el-icon>
          截止: {{ formatDate(todo.dueAt) }}
        </span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Timer } from '@element-plus/icons-vue'

interface Todo {
  id: string
  title: string
  description?: string
  status: 'pending' | 'completed' | 'submitted'
  type?: string
  dueAt?: string
}

interface Props {
  todo: Todo
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [todo: Todo]
}>()

const handleClick = () => {
  emit('click', props.todo)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.todo-card {
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid var(--gray-200);
}

.todo-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.todo-card.pending {
  border-color: var(--warning);
}

.todo-card.completed,
.todo-card.submitted {
  border-color: var(--success);
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  gap: var(--space-2);
}

.todo-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.todo-content {
  color: var(--text-secondary);
}

.todo-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.todo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-xs);
}

.todo-due {
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  white-space: nowrap;
}

/* 自定义Element Plus样式 */
:deep(.el-card) {
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: var(--shadow-md);
}

:deep(.el-card__body) {
  padding: var(--space-4);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .todo-title {
    font-size: 1rem;
  }

  .todo-description {
    font-size: 0.875rem;
  }

  .todo-meta {
    font-size: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .todo-due {
    width: 100%;
  }

  :deep(.el-card__body) {
    padding: var(--space-3);
  }
}

@media (max-width: 480px) {
  .todo-title {
    font-size: 0.95rem;
  }

  .todo-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}
</style>
