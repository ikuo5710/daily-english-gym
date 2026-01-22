<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useApi } from '@/composables/useApi';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const sessionStore = useSessionStore();
const api = useApi();

const isLoadingTranscription = ref(true);
const isLoadingFeedback = ref(false);
const isSavingLog = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const feedback = computed(() => sessionStore.feedback);

onMounted(async () => {
  if (!sessionStore.currentSession || !sessionStore.recordingBlob) {
    router.push('/input');
    return;
  }

  // 既に文字起こしとフィードバックがあればスキップ
  if (sessionStore.transcription && sessionStore.feedback) {
    isLoadingTranscription.value = false;
    return;
  }

  // 文字起こし
  try {
    const response = await api.transcribeSpeech(sessionStore.recordingBlob);
    sessionStore.setTranscription(response.text);
    isLoadingTranscription.value = false;

    // フィードバック生成
    isLoadingFeedback.value = true;
    const feedbackResponse = await api.generateFeedback({
      articleContent: sessionStore.currentSession.newsInput.content,
      spokenText: response.text,
    });
    sessionStore.setFeedback(feedbackResponse);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '処理に失敗しました';
  } finally {
    isLoadingTranscription.value = false;
    isLoadingFeedback.value = false;
  }
});

async function saveAndComplete() {
  if (!sessionStore.currentSession || !sessionStore.feedback) return;

  isSavingLog.value = true;
  errorMessage.value = null;

  try {
    // 音声ファイルも一緒に保存（録音 + TTS）
    await api.saveLogWithAudio(
      {
        date: sessionStore.currentSession.date,
        newsTitle: sessionStore.currentSession.newsInput.title || 'Untitled',
        newsUrl: sessionStore.currentSession.newsInput.sourceUrl,
        newsContent: sessionStore.currentSession.newsInput.content,
        speakingQuestion: sessionStore.speakingQuestion || '',
        spoken: sessionStore.feedback.spoken,
        corrected: sessionStore.feedback.corrected,
        upgraded: sessionStore.feedback.upgraded,
        comment: sessionStore.feedback.comment,
      },
      sessionStore.recordingBlob ?? undefined,
      sessionStore.ttsBlob ?? undefined
    );

    sessionStore.completeSession();
    successMessage.value = '学習ログを保存しました！';

    // 少し待ってからホームへ
    setTimeout(() => {
      sessionStore.resetSession();
      router.push('/');
    }, 2000);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'ログの保存に失敗しました';
  } finally {
    isSavingLog.value = false;
  }
}

function goBack() {
  router.push('/speak');
}
</script>

<template>
  <div class="reflect-view">
    <div class="header">
      <button class="back-button" @click="goBack">&larr; 戻る</button>
      <h2>Reflect - 振り返る</h2>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <div v-if="isLoadingTranscription" class="loading-container">
      <LoadingSpinner size="large" message="音声を文字起こし中..." />
    </div>

    <div v-else-if="isLoadingFeedback" class="loading-container">
      <LoadingSpinner size="large" message="フィードバックを生成中..." />
    </div>

    <template v-else-if="feedback">
      <div class="feedback-section">
        <div class="feedback-card card">
          <h3>あなたの発話</h3>
          <p class="spoken-text">{{ feedback.spoken }}</p>
        </div>

        <div class="feedback-card card">
          <h3>自然な英語に修正</h3>
          <p class="corrected-text">{{ feedback.corrected }}</p>
        </div>

        <div class="feedback-card card">
          <h3>IT業界らしい表現に</h3>
          <p class="upgraded-text">{{ feedback.upgraded }}</p>
        </div>

        <div class="feedback-card comment-card card">
          <h3>アドバイス</h3>
          <p class="comment-text">{{ feedback.comment }}</p>
        </div>
      </div>

      <div class="action-section">
        <button class="complete-button" :disabled="isSavingLog" @click="saveAndComplete">
          <span v-if="isSavingLog">保存中...</span>
          <span v-else>今日の学習を完了する</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.reflect-view {
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

.success-message {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 4rem 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.feedback-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.feedback-card h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 0.75rem;
}

.feedback-card p {
  margin: 0;
  line-height: 1.7;
}

.spoken-text {
  color: #666;
}

.corrected-text {
  color: #333;
}

.upgraded-text {
  color: #333;
  font-weight: 500;
}

.comment-card {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
}

.comment-text {
  color: #5b21b6;
}

.action-section {
  text-align: center;
}

.complete-button {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.1s,
    opacity 0.2s;
}

.complete-button:not(:disabled):hover {
  transform: translateY(-1px);
}

.complete-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
