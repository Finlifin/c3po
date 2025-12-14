<template>
  <div :class="containerClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  fluid?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  fluid: false,
  maxWidth: 'xl',
  padding: 'md'
})

const containerClass = computed(() => {
  return [
    'page-container',
    {
      'page-container-fluid': props.fluid,
      [`page-container-max-${props.maxWidth}`]: !props.fluid,
      [`page-container-padding-${props.padding}`]: props.padding !== 'none'
    }
  ]
})
</script>

<style scoped>
.page-container {
  width: 100%;
  margin: 0 auto;
  min-height: 100%;
}

.page-container-fluid {
  max-width: 100%;
}

.page-container-max-sm {
  max-width: var(--container-sm, 720px);
}

.page-container-max-md {
  max-width: var(--container-md, 960px);
}

.page-container-max-lg {
  max-width: var(--container-lg, 1200px);
}

.page-container-max-xl {
  max-width: var(--container-max-width, 1440px);
}

.page-container-max-full {
  max-width: 100%;
}

.page-container-padding-sm {
  padding: var(--space-4, 1rem);
}

.page-container-padding-md {
  padding: var(--space-6, 1.5rem);
}

.page-container-padding-lg {
  padding: var(--space-8, 2rem);
}

/* Responsive padding */
@media (max-width: 1024px) {
  .page-container-padding-md {
    padding: var(--space-5, 1.25rem);
  }
  
  .page-container-padding-lg {
    padding: var(--space-6, 1.5rem);
  }
}

@media (max-width: 768px) {
  .page-container-padding-sm {
    padding: var(--space-3, 0.75rem);
  }
  
  .page-container-padding-md {
    padding: var(--space-4, 1rem);
  }
  
  .page-container-padding-lg {
    padding: var(--space-5, 1.25rem);
  }
}

@media (max-width: 480px) {
  .page-container-padding-sm {
    padding: var(--space-2, 0.5rem);
  }
  
  .page-container-padding-md {
    padding: var(--space-3, 0.75rem);
  }
  
  .page-container-padding-lg {
    padding: var(--space-4, 1rem);
  }
}
</style>

