<script setup>
import { computed } from 'vue'

// 按钮属性
const props = defineProps({
  // 按钮类型
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger', 'text'].includes(value)
  },
  // 按钮大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否为加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 是否为块级元素
  block: {
    type: Boolean,
    default: false
  },
  // 是否为圆形
  round: {
    type: Boolean,
    default: false
  },
  // 是否为幽灵按钮
  ghost: {
    type: Boolean,
    default: false
  },
  // 原生按钮类型
  nativeType: {
    type: String,
    default: 'button'
  },
  // 图标
  icon: {
    type: String,
    default: ''
  },
  // 图标位置
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  }
})

// 事件
const emit = defineEmits(['click'])

// 计算按钮类名
const buttonClasses = computed(() => {
  const classes = ['btn']
  
  // 类型类名
  classes.push(`btn-${props.type}`)
  
  // 大小类名
  classes.push(`btn-${props.size}`)
  
  // 状态类名
  if (props.disabled) {
    classes.push('btn-disabled')
  }
  
  if (props.loading) {
    classes.push('btn-loading')
  }
  
  // 样式修饰类
  if (props.block) {
    classes.push('btn-block')
  }
  
  if (props.round) {
    classes.push('btn-round')
  }
  
  if (props.ghost) {
    classes.push('btn-ghost')
  }
  
  return classes
})

// 计算图标类名
const iconClasses = computed(() => {
  return {
    'btn-icon': true,
    'btn-icon-left': props.iconPosition === 'left',
    'btn-icon-right': props.iconPosition === 'right'
  }
})

// 处理点击事件
const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="buttonClasses"
    :type="nativeType"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- 加载图标 -->
    <span v-if="loading" class="btn-loading-icon">
      <svg xmlns="http://www.w3.org/2000/svg" class="loading-spinner" viewBox="0 0 24 24">
        <circle class="loading-path" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle>
      </svg>
    </span>
    
    <!-- 左侧图标 -->
    <span v-else-if="icon && iconPosition === 'left'" :class="iconClasses">
      {{ icon }}
    </span>
    
    <!-- 按钮文本 -->
    <span v-if="$slots.default" class="btn-text">
      <slot></slot>
    </span>
    
    <!-- 右侧图标 -->
    <span v-else-if="icon && iconPosition === 'right'" :class="iconClasses">
      {{ icon }}
    </span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;
}

/* 按钮类型样式 */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn-primary:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.2);
}

.btn-secondary {
  background-color: white;
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-secondary:hover:not(:disabled):not(.btn-loading) {
  background-color: var(--background-secondary);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-success {
  background-color: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.btn-success:hover:not(:disabled):not(.btn-loading) {
  background-color: #28a745;
  border-color: #28a745;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.2);
}

.btn-warning {
  background-color: var(--warning-color);
  color: white;
  border-color: var(--warning-color);
}

.btn-warning:hover:not(:disabled):not(.btn-loading) {
  background-color: #e08a00;
  border-color: #e08a00;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
}

.btn-danger {
  background-color: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

.btn-danger:hover:not(:disabled):not(.btn-loading) {
  background-color: #d0021b;
  border-color: #d0021b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
}

.btn-text {
  background-color: transparent;
  color: var(--primary-color);
  border-color: transparent;
}

.btn-text:hover:not(:disabled):not(.btn-loading) {
  background-color: rgba(0, 113, 227, 0.1);
  color: var(--primary-hover);
}

/* 按钮大小 */
.btn-small {
  font-size: 14px;
  padding: 6px 12px;
  min-height: 32px;
}

.btn-medium {
  font-size: 14px;
  padding: 10px 16px;
  min-height: 40px;
}

.btn-large {
  font-size: 16px;
  padding: 12px 20px;
  min-height: 48px;
}

/* 状态样式 */
.btn-disabled,
.btn-loading {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-loading {
  position: relative;
}

/* 样式修饰 */
.btn-block {
  display: flex;
  width: 100%;
}

.btn-round {
  border-radius: 50px;
}

.btn-ghost {
  background-color: transparent;
  border-color: currentColor;
}

/* 图标样式 */
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.btn-icon-left {
  order: -1;
}

.btn-icon-right {
  order: 1;
}

/* 加载动画 */
.btn-loading-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

.loading-path {
  stroke-dasharray: 30;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 30;
  }
  50% {
    stroke-dashoffset: 75;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 120;
    transform: rotate(450deg);
  }
}

/* 按钮文本 */
.btn-text {
  display: inline-block;
  line-height: 1.2;
}

/* 按钮激活状态 */
.btn:active:not(:disabled):not(.btn-loading) {
  transform: translateY(0);
  box-shadow: none;
}

/* 焦点状态 */
.btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .btn {
    font-size: 14px;
  }
  
  .btn-large {
    font-size: 16px;
  }
}
</style>