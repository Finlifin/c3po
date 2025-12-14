<template>
  <div class="stats-grid">
    <slot />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--grid-gap, 24px);
  width: 100%;
}

/* Responsive columns */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--grid-gap-sm, 16px);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--grid-gap-xs, 12px);
  }
}
</style>

