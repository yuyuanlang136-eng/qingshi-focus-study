<script setup>
import { CheckCircle2, CircleAlert } from '@lucide/vue'

defineProps({ message: { type: String, default: '' }, type: { type: String, default: 'success' } })
</script>

<template>
  <Transition name="toast">
    <div v-if="message" class="toast" :class="type" role="status" aria-live="polite">
      <CircleAlert v-if="type === 'error'" :size="17" />
      <CheckCircle2 v-else :size="17" />
      {{ message }}
    </div>
  </Transition>
</template>
