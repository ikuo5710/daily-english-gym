<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useApi } from '@/composables/useApi';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const sessionStore = useSessionStore();
const api = useApi();

const articleContent = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const MAX_LENGTH = 10000;

const isValid = computed(() => {
  return articleContent.value.trim().length > 0 && articleContent.value.length <= MAX_LENGTH;
});

const charCount = computed(() => articleContent.value.length);

async function handleSubmit() {
  if (!isValid.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    // ニュースを解析
    const parsedNews = await api.parseNews({
      type: 'text',
      content: articleContent.value,
    });

    // セッション開始
    sessionStore.startNewSession(parsedNews.content);

    if (sessionStore.currentSession) {
      sessionStore.currentSession.newsInput.title = parsedNews.title;
    }

    // 次の画面へ
    router.push('/understand');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '記事の解析に失敗しました';
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
  router.push('/');
}
</script>

<template>
  <div class="input-view">
    <div class="header">
      <button class="back-button" @click="goBack">&larr; 戻る</button>
      <h2>記事を入力</h2>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="article">AIニュース記事を貼り付けてください</label>
        <textarea
          id="article"
          v-model="articleContent"
          placeholder="ここにニュース記事の本文を貼り付けてください..."
          :disabled="isLoading"
          rows="12"
        ></textarea>
        <div class="char-count" :class="{ 'over-limit': charCount > MAX_LENGTH }">
          {{ charCount.toLocaleString() }} / {{ MAX_LENGTH.toLocaleString() }} 文字
        </div>
      </div>

      <div v-if="isLoading" class="loading-container">
        <LoadingSpinner message="記事を解析中..." />
      </div>

      <button v-else type="submit" class="submit-button" :disabled="!isValid">学習を開始する</button>
    </form>
  </div>
</template>

<style scoped>
.input-view {
  max-width: 700px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.back-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.back-button:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-family: inherit;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  min-height: 250px;
  transition: border-color 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.char-count {
  text-align: right;
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
}

.char-count.over-limit {
  color: #dc2626;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.1s,
    opacity 0.2s;
}

.submit-button:not(:disabled):hover {
  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
