<template>
  <GridRow v-bind="$attrs">
    <slot />
  </GridRow>
</template>

<script setup lang="ts">
import GridRow from './GridRow.vue'
</script>

