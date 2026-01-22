<script setup lang="ts">
defineProps<{
  size?: 'small' | 'medium' | 'large';
  message?: string;
}>();
</script>

<template>
  <div class="loading-container">
    <div
      class="spinner"
      :class="{
        'spinner--small': size === 'small',
        'spinner--medium': size === 'medium' || !size,
        'spinner--large': size === 'large',
      }"
    ></div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  border-radius: 50%;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  animation: spin 0.8s linear infinite;
}

.spinner--small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner--medium {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner--large {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  margin-top: 1rem;
  color: #666;
  font-size: 0.875rem;
}
</style>
