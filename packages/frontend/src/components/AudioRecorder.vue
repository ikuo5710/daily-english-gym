<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

const emit = defineEmits<{
  (e: 'recordingComplete', blob: Blob, duration: number): void;
}>();

const isRecording = ref(false);
const isPaused = ref(false);
const recordingTime = ref(0);
const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string | null>(null);

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let timerInterval: ReturnType<typeof setInterval> | null = null;
let startTime = 0;

const formattedTime = computed(() => {
  const mins = Math.floor(recordingTime.value / 60);
  const secs = recordingTime.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });

    audioChunks = [];
    recordingTime.value = 0;
    startTime = Date.now();

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      audioBlob.value = blob;

      // 前のURLを解放
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value);
      }
      audioUrl.value = URL.createObjectURL(blob);

      // ストリームを停止
      stream.getTracks().forEach((track) => track.stop());

      emit('recordingComplete', blob, recordingTime.value);
    };

    mediaRecorder.start(1000); // 1秒ごとにデータを収集
    isRecording.value = true;

    // タイマー開始
    timerInterval = setInterval(() => {
      recordingTime.value = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
  } catch (error) {
    console.error('Failed to start recording:', error);
    alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
    isPaused.value = false;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
}

function resetRecording() {
  audioBlob.value = null;
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
  }
  recordingTime.value = 0;
}

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
  }
});

defineExpose({
  audioBlob,
  resetRecording,
});
</script>

<template>
  <div class="audio-recorder">
    <div class="recorder-display">
      <div class="recording-indicator" :class="{ active: isRecording }"></div>
      <span class="recording-time">{{ formattedTime }}</span>
    </div>

    <div class="recorder-controls">
      <button v-if="!isRecording && !audioBlob" class="record-button" @click="startRecording">
        録音開始
      </button>

      <button v-if="isRecording" class="stop-button" @click="stopRecording">録音停止</button>

      <template v-if="audioBlob && !isRecording">
        <div class="playback-section">
          <audio :src="audioUrl || undefined" controls class="audio-preview"></audio>
          <button class="retry-button" @click="resetRecording">録り直す</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.audio-recorder {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
}

.recorder-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.recording-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ccc;
  transition: background-color 0.3s;
}

.recording-indicator.active {
  background-color: #ef4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.recording-time {
  font-size: 2rem;
  font-weight: 600;
  font-family: monospace;
  color: #333;
}

.recorder-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.record-button,
.stop-button {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition:
    transform 0.1s,
    box-shadow 0.2s;
}

.record-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.record-button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.stop-button {
  background-color: #ef4444;
  color: white;
}

.stop-button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.playback-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.audio-preview {
  width: 100%;
  max-width: 400px;
}

.retry-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background-color: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #d0d0d0;
}
</style>
