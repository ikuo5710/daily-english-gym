<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useApi } from '@/composables/useApi';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import AudioRecorder from '@/components/AudioRecorder.vue';

const router = useRouter();
const sessionStore = useSessionStore();
const api = useApi();

const isLoadingQuestion = ref(true);
const errorMessage = ref<string | null>(null);
const hasRecording = ref(false);
const recordingDuration = ref(0);

const question = computed(() => sessionStore.speakingQuestion);

onMounted(async () => {
  if (!sessionStore.currentSession) {
    router.push('/input');
    return;
  }

  // 録音が既に存在する場合は状態を復元
  if (sessionStore.recordingBlob) {
    hasRecording.value = true;
    recordingDuration.value = sessionStore.currentSession.recording?.duration ?? 0;
  }

  // 質問が既に生成されていればスキップ
  if (sessionStore.speakingQuestion) {
    isLoadingQuestion.value = false;
    return;
  }

  // 質問生成
  try {
    const response = await api.generateQuestion({
      content: sessionStore.currentSession.newsInput.content,
    });
    sessionStore.setSpeakingQuestion(response.question);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '質問の生成に失敗しました';
  } finally {
    isLoadingQuestion.value = false;
  }
});

function handleRecordingComplete(blob: Blob, duration: number) {
  sessionStore.setRecordingBlob(blob, duration);
  hasRecording.value = true;
  recordingDuration.value = duration;
}

function goToReflect() {
  if (!hasRecording.value) {
    errorMessage.value = '回答を録音してください';
    return;
  }
  router.push('/reflect');
}

function goBack() {
  router.push('/understand');
}
</script>

<template>
  <div class="speak-view">
    <div class="header">
      <button class="back-button" @click="goBack">&larr; 戻る</button>
      <h2>Speak - 話す</h2>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="isLoadingQuestion" class="loading-container">
      <LoadingSpinner size="large" message="質問を生成中..." />
    </div>

    <template v-else>
      <div class="question-section card">
        <h3>Today's Question</h3>
        <p class="question-text">{{ question }}</p>
      </div>

      <div class="instruction">
        <p>上の質問について、30〜60秒で自分の意見や説明を英語で話してみましょう。</p>
      </div>

      <div class="recorder-section">
        <AudioRecorder
          :initialBlob="sessionStore.recordingBlob"
          :initialDuration="recordingDuration"
          @recordingComplete="handleRecordingComplete"
        />
      </div>

      <div class="action-section">
        <button class="next-button" :disabled="!hasRecording" @click="goToReflect">
          次へ - フィードバック
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.speak-view {
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

.question-section {
  margin-bottom: 1.5rem;
  text-align: center;
}

.question-section h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.question-text {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.5;
  color: #333;
  margin: 0;
}

.instruction {
  text-align: center;
  margin-bottom: 2rem;
}

.instruction p {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

.recorder-section {
  margin-bottom: 2rem;
}

.action-section {
  text-align: center;
}

.next-button {
  padding: 1rem 2rem;
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

.next-button:not(:disabled):hover {
  transform: translateY(-1px);
}

.next-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
