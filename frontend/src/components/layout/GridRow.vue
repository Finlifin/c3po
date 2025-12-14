<template>
  <div :class="rowClass" :style="rowStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  gutter?: number | [number, number]
  align?: 'start' | 'end' | 'center' | 'stretch'
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
}

const props = withDefaults(defineProps<Props>(), {
  gutter: 24,
  align: 'stretch',
  justify: 'start'
})

const rowClass = computed(() => {
  return [
    'grid-row',
    `grid-row-align-${props.align}`,
    `grid-row-justify-${props.justify}`
  ]
})

const rowStyle = computed(() => {
  const gutter = props.gutter
  const [horizontalGutter, verticalGutter] = Array.isArray(gutter) 
    ? gutter 
    : [gutter, gutter]
  
  return {
    '--row-gutter-x': `${horizontalGutter}px`,
    '--row-gutter-y': `${verticalGutter}px`
  }
})
</script>

<style scoped>
.grid-row {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns, 12), 1fr);
  gap: var(--row-gutter-y, var(--grid-gap)) var(--row-gutter-x, var(--grid-gap));
  width: 100%;
}

.grid-row-align-start {
  align-items: start;
}

.grid-row-align-end {
  align-items: end;
}

.grid-row-align-center {
  align-items: center;
}

.grid-row-align-stretch {
  align-items: stretch;
}

.grid-row-justify-start {
  justify-items: start;
}

.grid-row-justify-end {
  justify-items: end;
}

.grid-row-justify-center {
  justify-items: center;
}

.grid-row-justify-space-between {
  justify-content: space-between;
}

.grid-row-justify-space-around {
  justify-content: space-around;
}

.grid-row-justify-space-evenly {
  justify-content: space-evenly;
}
</style>

