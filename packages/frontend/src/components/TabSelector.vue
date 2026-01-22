<script setup lang="ts">
defineProps<{
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', id: string): void;
}>();

function selectTab(id: string) {
  emit('update:activeTab', id);
}
</script>

<template>
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: activeTab === tab.id }"
      @click="selectTab(tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}
</style>
