<template>
  <div :class="gridClass" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  minWidth?: string
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: '300px',
  gap: 'md',
  columns: undefined
})

const gridClass = computed(() => {
  return [
    'content-grid',
    `content-grid-gap-${props.gap}`
  ]
})

const gridStyle = computed(() => {
  const styles: Record<string, string> = {
    '--grid-min-width': props.minWidth
  }
  
  if (props.columns) {
    if (typeof props.columns === 'number') {
      styles['grid-template-columns'] = `repeat(${props.columns}, 1fr)`
    } else {
      // Responsive columns
      styles['grid-template-columns'] = `repeat(auto-fit, minmax(${props.minWidth}, 1fr))`
      if (props.columns.xs) {
        styles['--grid-cols-xs'] = props.columns.xs.toString()
      }
      if (props.columns.sm) {
        styles['--grid-cols-sm'] = props.columns.sm.toString()
      }
      if (props.columns.md) {
        styles['--grid-cols-md'] = props.columns.md.toString()
      }
      if (props.columns.lg) {
        styles['--grid-cols-lg'] = props.columns.lg.toString()
      }
      if (props.columns.xl) {
        styles['--grid-cols-xl'] = props.columns.xl.toString()
      }
    }
  } else {
    // Default: auto-fit with minWidth
    styles['grid-template-columns'] = `repeat(auto-fit, minmax(${props.minWidth}, 1fr))`
  }
  
  return styles
})
</script>

<style scoped>
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--grid-min-width, 300px), 1fr));
  width: 100%;
}

.content-grid-gap-xs {
  gap: var(--grid-gap-xs, 12px);
}

.content-grid-gap-sm {
  gap: var(--grid-gap-sm, 16px);
}

.content-grid-gap-md {
  gap: var(--grid-gap, 24px);
}

.content-grid-gap-lg {
  gap: 32px;
}

/* Responsive gap adjustments */
@media (max-width: 1024px) {
  .content-grid-gap-md {
    gap: var(--grid-gap-sm, 16px);
  }
  
  .content-grid-gap-lg {
    gap: var(--grid-gap, 24px);
  }
}

@media (max-width: 768px) {
  .content-grid-gap-xs {
    gap: 8px;
  }
  
  .content-grid-gap-sm {
    gap: var(--grid-gap-xs, 12px);
  }
  
  .content-grid-gap-md {
    gap: var(--grid-gap-xs, 12px);
  }
  
  .content-grid-gap-lg {
    gap: var(--grid-gap-sm, 16px);
  }
}

/* Responsive columns - 移动端强制单列 */
@media (max-width: 480px) {
  .content-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr !important;
  }
}

/* 平板和桌面端使用响应式列数 */
@media (min-width: 769px) and (max-width: 1024px) {
  .content-grid {
    grid-template-columns: repeat(var(--grid-cols-md, 2), 1fr) !important;
  }
}

@media (min-width: 1025px) and (max-width: 1200px) {
  .content-grid {
    grid-template-columns: repeat(var(--grid-cols-lg, 3), 1fr) !important;
  }
}

@media (min-width: 1201px) {
  .content-grid {
    grid-template-columns: repeat(var(--grid-cols-xl, 4), 1fr) !important;
  }
}
</style>

