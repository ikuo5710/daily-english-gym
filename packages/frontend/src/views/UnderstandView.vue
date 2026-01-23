<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useApi } from '@/composables/useApi';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import TabSelector from '@/components/TabSelector.vue';
import AudioPlayer from '@/components/AudioPlayer.vue';

const router = useRouter();
const sessionStore = useSessionStore();
const api = useApi();

const isLoadingTexts = ref(true);
const isLoadingAudio = ref(false);
const errorMessage = ref<string | null>(null);
const activeTab = ref('level1');
const audioUrl = ref<string | null>(null);

const tabs = [
  { id: 'level1', label: 'Level 1 (Easy)' },
  { id: 'level2', label: 'Level 2 (Speaking)' },
  { id: 'level3', label: 'Level 3 (Original)' },
];

const currentText = computed(() => {
  const texts = sessionStore.currentSession?.generatedTexts;
  if (!texts) return '';

  switch (activeTab.value) {
    case 'level1':
      return texts.level1;
    case 'level2':
      return texts.level2;
    case 'level3':
      return texts.level3;
    default:
      return '';
  }
});

const hasTexts = computed(() => {
  return sessionStore.currentSession?.generatedTexts !== undefined;
});

onMounted(async () => {
  if (!sessionStore.currentSession) {
    router.push('/input');
    return;
  }

  // キャッシュが存在する場合はスキップ
  if (sessionStore.currentSession.generatedTexts) {
    isLoadingTexts.value = false;
    // TTS音声のキャッシュも復元
    if (sessionStore.ttsBlob && !audioUrl.value) {
      audioUrl.value = URL.createObjectURL(sessionStore.ttsBlob);
    }
    return;
  }

  // テキスト生成
  try {
    const texts = await api.generateLevels({
      content: sessionStore.currentSession.newsInput.content,
    });
    sessionStore.setGeneratedTexts(texts);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'テキストの生成に失敗しました';
  } finally {
    isLoadingTexts.value = false;
  }
});

async function generateAudio() {
  if (!sessionStore.currentSession?.generatedTexts) return;

  isLoadingAudio.value = true;
  errorMessage.value = null;

  try {
    const audioBlob = await api.generateTTS({
      text: sessionStore.currentSession.generatedTexts.level2,
    });

    // TTS Blobをstoreに保存
    sessionStore.setTtsBlob(audioBlob);

    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value);
    }
    audioUrl.value = URL.createObjectURL(audioBlob);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '音声の生成に失敗しました';
  } finally {
    isLoadingAudio.value = false;
  }
}

function goToSpeak() {
  router.push('/speak');
}

function goBack() {
  router.push('/input');
}
</script>

<template>
  <div class="understand-view">
    <div class="header">
      <button class="back-button" @click="goBack">&larr; 戻る</button>
      <h2>Understand - 理解する</h2>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="isLoadingTexts" class="loading-container">
      <LoadingSpinner size="large" message="テキストを生成中..." />
    </div>

    <template v-else-if="hasTexts">
      <TabSelector v-model:activeTab="activeTab" :tabs="tabs" />

      <div class="text-content card">
        <p class="text-body">{{ currentText }}</p>
      </div>

      <div class="audio-section">
        <h3>Level 2 音声</h3>
        <div v-if="!audioUrl && !isLoadingAudio">
          <button class="generate-audio-button" @click="generateAudio">音声を生成する</button>
        </div>
        <div v-else-if="isLoadingAudio">
          <LoadingSpinner message="音声を生成中..." />
        </div>
        <AudioPlayer
          v-else
          :audioUrl="audioUrl"
          :playbackSpeed="sessionStore.audioPlaybackSpeed"
          @update:playbackSpeed="sessionStore.setAudioPlaybackSpeed"
        />
      </div>

      <div class="action-section">
        <button class="next-button" @click="goToSpeak">次へ - スピーキング</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.understand-view {
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

.text-content {
  margin-bottom: 2rem;
}

.text-body {
  line-height: 1.8;
  white-space: pre-wrap;
  margin: 0;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.audio-section {
  margin-bottom: 2rem;
}

.audio-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.generate-audio-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.generate-audio-button:hover {
  background-color: #d0d0d0;
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
  transition: transform 0.1s;
}

.next-button:hover {
  transform: translateY(-1px);
}
</style>
