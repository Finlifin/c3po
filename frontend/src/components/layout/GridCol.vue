<template>
  <div :class="colClass" :style="colStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  span?: number
  offset?: number
  xs?: number | { span?: number; offset?: number }
  sm?: number | { span?: number; offset?: number }
  md?: number | { span?: number; offset?: number }
  lg?: number | { span?: number; offset?: number }
  xl?: number | { span?: number; offset?: number }
}

const props = withDefaults(defineProps<Props>(), {
  span: 24,
  offset: 0
})

const colClass = computed(() => {
  const classes = ['grid-col']
  
  // Base span
  if (props.span) {
    classes.push(`grid-col-span-${props.span}`)
  }
  
  // Base offset
  if (props.offset) {
    classes.push(`grid-col-offset-${props.offset}`)
  }
  
  // Responsive classes
  if (props.xs) {
    classes.push('grid-col-xs')
  }
  if (props.sm) {
    classes.push('grid-col-sm')
  }
  if (props.md) {
    classes.push('grid-col-md')
  }
  if (props.lg) {
    classes.push('grid-col-lg')
  }
  if (props.xl) {
    classes.push('grid-col-xl')
  }
  
  return classes
})

const colStyle = computed(() => {
  const styles: Record<string, string> = {}
  
  // Base span
  if (props.span) {
    const spanPercent = (props.span / 24) * 100
    styles['--col-span'] = `${spanPercent}%`
  }
  
  // Base offset
  if (props.offset) {
    const offsetPercent = (props.offset / 24) * 100
    styles['--col-offset'] = `${offsetPercent}%`
  }
  
  // Responsive spans
  if (props.xs) {
    const xsSpan = typeof props.xs === 'number' ? props.xs : props.xs.span || 24
    styles['--col-span-xs'] = `${(xsSpan / 24) * 100}%`
    if (typeof props.xs === 'object' && props.xs.offset) {
      styles['--col-offset-xs'] = `${(props.xs.offset / 24) * 100}%`
    }
  }
  
  if (props.sm) {
    const smSpan = typeof props.sm === 'number' ? props.sm : props.sm.span || 24
    styles['--col-span-sm'] = `${(smSpan / 24) * 100}%`
    if (typeof props.sm === 'object' && props.sm.offset) {
      styles['--col-offset-sm'] = `${(props.sm.offset / 24) * 100}%`
    }
  }
  
  if (props.md) {
    const mdSpan = typeof props.md === 'number' ? props.md : props.md.span || 24
    styles['--col-span-md'] = `${(mdSpan / 24) * 100}%`
    if (typeof props.md === 'object' && props.md.offset) {
      styles['--col-offset-md'] = `${(props.md.offset / 24) * 100}%`
    }
  }
  
  if (props.lg) {
    const lgSpan = typeof props.lg === 'number' ? props.lg : props.lg.span || 24
    styles['--col-span-lg'] = `${(lgSpan / 24) * 100}%`
    if (typeof props.lg === 'object' && props.lg.offset) {
      styles['--col-offset-lg'] = `${(props.lg.offset / 24) * 100}%`
    }
  }
  
  if (props.xl) {
    const xlSpan = typeof props.xl === 'number' ? props.xl : props.xl.span || 24
    styles['--col-span-xl'] = `${(xlSpan / 24) * 100}%`
    if (typeof props.xl === 'object' && props.xl.offset) {
      styles['--col-offset-xl'] = `${(props.xl.offset / 24) * 100}%`
    }
  }
  
  return styles
})
</script>

<style scoped>
.grid-col {
  grid-column: span var(--grid-columns, 12);
  width: 100%;
}

/* Base span (24-column system) */
.grid-col-span-1 { grid-column: span 1; }
.grid-col-span-2 { grid-column: span 2; }
.grid-col-span-3 { grid-column: span 3; }
.grid-col-span-4 { grid-column: span 4; }
.grid-col-span-5 { grid-column: span 5; }
.grid-col-span-6 { grid-column: span 6; }
.grid-col-span-7 { grid-column: span 7; }
.grid-col-span-8 { grid-column: span 8; }
.grid-col-span-9 { grid-column: span 9; }
.grid-col-span-10 { grid-column: span 10; }
.grid-col-span-11 { grid-column: span 11; }
.grid-col-span-12 { grid-column: span 12; }
.grid-col-span-13 { grid-column: span 13; }
.grid-col-span-14 { grid-column: span 14; }
.grid-col-span-15 { grid-column: span 15; }
.grid-col-span-16 { grid-column: span 16; }
.grid-col-span-17 { grid-column: span 17; }
.grid-col-span-18 { grid-column: span 18; }
.grid-col-span-19 { grid-column: span 19; }
.grid-col-span-20 { grid-column: span 20; }
.grid-col-span-21 { grid-column: span 21; }
.grid-col-span-22 { grid-column: span 22; }
.grid-col-span-23 { grid-column: span 23; }
.grid-col-span-24 { grid-column: span 24; }

/* Base offset */
.grid-col-offset-1 { margin-left: calc(1 / 24 * 100%); }
.grid-col-offset-2 { margin-left: calc(2 / 24 * 100%); }
.grid-col-offset-3 { margin-left: calc(3 / 24 * 100%); }
.grid-col-offset-4 { margin-left: calc(4 / 24 * 100%); }
.grid-col-offset-5 { margin-left: calc(5 / 24 * 100%); }
.grid-col-offset-6 { margin-left: calc(6 / 24 * 100%); }
.grid-col-offset-7 { margin-left: calc(7 / 24 * 100%); }
.grid-col-offset-8 { margin-left: calc(8 / 24 * 100%); }
.grid-col-offset-9 { margin-left: calc(9 / 24 * 100%); }
.grid-col-offset-10 { margin-left: calc(10 / 24 * 100%); }
.grid-col-offset-11 { margin-left: calc(11 / 24 * 100%); }
.grid-col-offset-12 { margin-left: calc(12 / 24 * 100%); }

/* Responsive: Mobile (≤480px) */
@media (max-width: 480px) {
  .grid-col-xs {
    grid-column: span var(--col-span-xs, 24) !important;
    margin-left: var(--col-offset-xs, 0) !important;
  }
}

/* Responsive: Small (≤768px) */
@media (max-width: 768px) {
  .grid-col-sm {
    grid-column: span var(--col-span-sm, 24) !important;
    margin-left: var(--col-offset-sm, 0) !important;
  }
}

/* Responsive: Medium (≤1024px) */
@media (max-width: 1024px) {
  .grid-col-md {
    grid-column: span var(--col-span-md, 24) !important;
    margin-left: var(--col-offset-md, 0) !important;
  }
}

/* Responsive: Large (≤1200px) */
@media (max-width: 1200px) {
  .grid-col-lg {
    grid-column: span var(--col-span-lg, 24) !important;
    margin-left: var(--col-offset-lg, 0) !important;
  }
}

/* Responsive: Extra Large (≤1440px) */
@media (max-width: 1440px) {
  .grid-col-xl {
    grid-column: span var(--col-span-xl, 24) !important;
    margin-left: var(--col-offset-xl, 0) !important;
  }
}
</style>

