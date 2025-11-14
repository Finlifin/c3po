<script setup>
import { ref, computed, watch } from 'vue'

// 输入框属性
const props = defineProps({
  // 绑定的值
  modelValue: {
    type: [String, Number],
    default: ''
  },
  // 输入框类型
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'password', 'email', 'tel', 'number', 'search'].includes(value)
  },
  // 占位符文本
  placeholder: {
    type: String,
    default: ''
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  // 是否为必填项
  required: {
    type: Boolean,
    default: false
  },
  // 输入框大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  // 标签文本
  label: {
    type: String,
    default: ''
  },
  // 错误消息
  error: {
    type: String,
    default: ''
  },
  // 帮助文本
  helperText: {
    type: String,
    default: ''
  },
  // 前缀图标
  prefixIcon: {
    type: String,
    default: ''
  },
  // 后缀图标
  suffixIcon: {
    type: String,
    default: ''
  },
  // 最大长度
  maxLength: {
    type: Number,
    default: null
  },
  // 是否显示字数统计
  showCount: {
    type: Boolean,
    default: false
  },
  // 自动完成
  autocomplete: {
    type: String,
    default: 'on'
  },
  // 输入框宽度
  width: {
    type: String,
    default: '100%'
  }
})

// 事件
const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input', 'change'])

// 内部状态
const inputRef = ref(null)
const isFocused = ref(false)
const showPassword = ref(false)

// 计算属性
const inputClasses = computed(() => {
  const classes = ['input-wrapper']
  
  // 大小类名
  classes.push(`input-${props.size}`)
  
  // 状态类名
  if (props.disabled) {
    classes.push('input-disabled')
  }
  
  if (props.readonly) {
    classes.push('input-readonly')
  }
  
  if (isFocused.value) {
    classes.push('input-focused')
  }
  
  if (props.error) {
    classes.push('input-error')
  }
  
  // 图标类名
  if (props.prefixIcon) {
    classes.push('input-has-prefix')
  }
  
  if (props.suffixIcon || props.type === 'password' || props.error) {
    classes.push('input-has-suffix')
  }
  
  return classes
})

// 计算显示的输入类型（处理密码可见性）
const displayType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

// 计算输入值长度
const inputLength = computed(() => {
  return String(props.modelValue || '').length
})

// 监听值变化
watch(() => props.modelValue, (newVal) => {
  emit('change', newVal)
})

// 方法
const handleInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('input', event)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

// 暴露方法给父组件
defineExpose({
  focus,
  blur,
  inputRef
})
</script>

<template>
  <div class="input-group" :style="{ width: width }">
    <!-- 标签 -->
    <label v-if="label" class="input-label" :for="`input-${Math.random().toString(36).substr(2, 9)}`">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    
    <!-- 输入框容器 -->
    <div :class="inputClasses" class="input-container">
      <!-- 前缀图标 -->
      <div v-if="prefixIcon" class="input-prefix">
        {{ prefixIcon }}
      </div>
      
      <!-- 输入框 -->
      <input
        ref="inputRef"
        :id="`input-${Math.random().toString(36).substr(2, 9)}`"
        :type="displayType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxLength"
        :autocomplete="autocomplete"
        :value="modelValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        class="input"
      />
      
      <!-- 后缀内容 -->
      <div class="input-suffix">
        <!-- 错误图标 -->
        <div v-if="error" class="input-error-icon">
          ❌
        </div>
        
        <!-- 密码切换图标 -->
        <div v-else-if="type === 'password'" class="input-password-toggle" @click="togglePasswordVisibility">
          {{ showPassword ? '👁️‍🗨️' : '👁️' }}
        </div>
        
        <!-- 自定义后缀图标 -->
        <div v-else-if="suffixIcon" class="input-suffix-icon">
          {{ suffixIcon }}
        </div>
      </div>
    </div>
    
    <!-- 帮助文本和错误消息 -->
    <div class="input-meta">
      <!-- 错误消息 -->
      <div v-if="error" class="input-error-message">
        {{ error }}
      </div>
      
      <!-- 帮助文本 -->
      <div v-else-if="helperText" class="input-helper-text">
        {{ helperText }}
      </div>
    </div>
    
    <!-- 字数统计 -->
    <div v-if="showCount && maxLength" class="input-count">
      {{ inputLength }}/{{ maxLength }}
    </div>
  </div>
</template>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
}

.input-required {
  color: var(--error-color);
  margin-left: 2px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: var(--background-primary);
}

.input {
  width: 100%;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.4;
  color: var(--text-primary);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
  padding: 10px 16px;
  outline: none;
}

/* 输入框大小 */
.input-small .input {
  font-size: 13px;
  padding: 6px 12px;
  min-height: 32px;
}

.input-medium .input {
  font-size: 14px;
  padding: 10px 16px;
  min-height: 40px;
}

.input-large .input {
  font-size: 16px;
  padding: 12px 20px;
  min-height: 48px;
}

/* 状态样式 */
.input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.input-focused .input {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.input-error .input {
  border-color: var(--error-color);
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
}

.input-disabled .input {
  background-color: var(--background-secondary);
  border-color: var(--border-color);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}

.input-readonly .input {
  background-color: var(--background-secondary);
  border-color: var(--border-color);
  cursor: not-allowed;
}

/* 图标样式 */
.input-prefix,
.input-suffix {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.input-prefix {
  color: var(--text-secondary);
  font-size: 16px;
  margin-left: 16px;
  z-index: 1;
}

.input-suffix {
  color: var(--text-secondary);
  font-size: 16px;
  margin-right: 16px;
  z-index: 1;
}

/* 带图标的输入框内边距调整 */
.input-has-prefix .input {
  padding-left: 40px;
}

.input-has-suffix .input {
  padding-right: 40px;
}

/* 密码切换按钮 */
.input-password-toggle {
  cursor: pointer;
  pointer-events: auto;
  transition: color 0.2s ease;
}

.input-password-toggle:hover {
  color: var(--primary-color);
}

/* 错误图标 */
.input-error-icon {
  color: var(--error-color);
}

/* 帮助文本和错误消息 */
.input-meta {
  font-size: 12px;
  line-height: 1.3;
  min-height: 16px;
}

.input-error-message {
  color: var(--error-color);
}

.input-helper-text {
  color: var(--text-secondary);
}

/* 字数统计 */
.input-count {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
  margin-top: 2px;
}

/* 输入框占位符样式 */
.input::placeholder {
  color: var(--text-secondary);
  opacity: 1;
}

.input:-ms-input-placeholder {
  color: var(--text-secondary);
}

.input::-ms-input-placeholder {
  color: var(--text-secondary);
}

/* 数字输入框样式优化 */
.input[type="number"]::-webkit-inner-spin-button,
.input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input[type="number"] {
  -moz-appearance: textfield;
}

/* 搜索输入框样式 */
.input[type="search"]::-webkit-search-decoration,
.input[type="search"]::-webkit-search-cancel-button,
.input[type="search"]::-webkit-search-results-button,
.input[type="search"]::-webkit-search-results-decoration {
  -webkit-appearance: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .input-group {
    width: 100%;
  }
  
  .input {
    font-size: 16px; /* 防止iOS缩放 */
  }
}
</style>