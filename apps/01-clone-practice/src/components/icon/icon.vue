<template>
    <!-- <i class="my-icon my-icon-check-circle" style="font-size: 24px; color: #19be6b;"></i> -->
     <i :class="classes" :style="styles"></i>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: string
  size?: number
  color?: string
}>()

const classes = computed(() => [
  'my-icon',
  props.type ? `my-icon-${props.type}` : ''
])

const styles = computed(() => ({
  fontSize: props.size ? `${props.size}px` : undefined,
  color: props.color
}))
</script>