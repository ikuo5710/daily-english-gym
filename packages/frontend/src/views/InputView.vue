<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useApi } from '@/composables/useApi';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const sessionStore = useSessionStore();
const api = useApi();

// 入力モード（text or url）
const inputMode = ref<'text' | 'url'>('text');

const articleContent = ref('');
const articleUrl = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const MAX_LENGTH = 10000;

const isValid = computed(() => {
  if (inputMode.value === 'url') {
    return articleUrl.value.trim().length > 0;
  }
  return articleContent.value.trim().length > 0 && articleContent.value.length <= MAX_LENGTH;
});

const charCount = computed(() => articleContent.value.length);

async function handleSubmit() {
  if (!isValid.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    // ニュースを解析
    const parsedNews =
      inputMode.value === 'url'
        ? await api.parseNews({
            type: 'url',
            url: articleUrl.value.trim(),
          })
        : await api.parseNews({
            type: 'text',
            content: articleContent.value,
          });

    // セッション開始
    sessionStore.startNewSession(parsedNews.content);

    if (sessionStore.currentSession) {
      sessionStore.currentSession.newsInput.title = parsedNews.title;
      if (parsedNews.sourceUrl) {
        sessionStore.currentSession.newsInput.sourceUrl = parsedNews.sourceUrl;
      }
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

    <!-- タブ切り替え -->
    <div class="input-tabs">
      <button
        class="tab-button"
        :class="{ active: inputMode === 'text' }"
        @click="inputMode = 'text'"
        type="button"
      >
        テキスト入力
      </button>
      <button
        class="tab-button"
        :class="{ active: inputMode === 'url' }"
        @click="inputMode = 'url'"
        type="button"
      >
        URL入力
      </button>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- テキスト入力モード -->
      <div v-if="inputMode === 'text'" class="form-group">
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

      <!-- URL入力モード -->
      <div v-else class="form-group">
        <label for="url">ニュース記事のURLを入力してください</label>
        <input
          id="url"
          v-model="articleUrl"
          type="url"
          placeholder="https://example.com/news/article"
          :disabled="isLoading"
          class="url-input"
        />
        <p class="url-hint">TechCrunch、Ars Technica などの主要な英語ニュースサイトに対応しています</p>
      </div>

      <div v-if="isLoading" class="loading-container">
        <LoadingSpinner :message="inputMode === 'url' ? '記事を取得中...' : '記事を解析中...'" />
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

.input-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  background: white;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s;
}

.tab-button:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-button.active {
  border-color: #667eea;
  background-color: #667eea;
  color: white;
}

.url-input {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-family: inherit;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.url-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.url-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.url-hint {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
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
