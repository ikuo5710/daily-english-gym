<script setup lang="ts">
import { ref, watch, onUnmounted, type ComponentPublicInstance } from 'vue';
import type { AudioPlaybackSpeed } from '@daily-english-gym/shared';

const props = defineProps<{
  audioUrl: string | null;
  playbackSpeed?: AudioPlaybackSpeed;
}>();

const emit = defineEmits<{
  (e: 'update:playbackSpeed', speed: AudioPlaybackSpeed): void;
}>();

const audio = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

const speedOptions: AudioPlaybackSpeed[] = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
const currentSpeed = ref<AudioPlaybackSpeed>(props.playbackSpeed || 0.8);

watch(
  () => props.audioUrl,
  (newUrl) => {
    if (audio.value && newUrl) {
      audio.value.src = newUrl;
      audio.value.playbackRate = currentSpeed.value;
    }
  }
);

watch(currentSpeed, (newSpeed) => {
  if (audio.value) {
    audio.value.playbackRate = newSpeed;
  }
  emit('update:playbackSpeed', newSpeed);
});

function setupAudio(el: Element | ComponentPublicInstance | null) {
  if (!el || !(el instanceof HTMLAudioElement)) return;
  audio.value = el;

  el.addEventListener('loadedmetadata', () => {
    duration.value = el.duration;
  });

  el.addEventListener('timeupdate', () => {
    currentTime.value = el.currentTime;
  });

  el.addEventListener('ended', () => {
    isPlaying.value = false;
    currentTime.value = 0;
  });

  el.addEventListener('play', () => {
    isPlaying.value = true;
  });

  el.addEventListener('pause', () => {
    isPlaying.value = false;
  });
}

function togglePlay() {
  if (!audio.value) return;

  if (isPlaying.value) {
    audio.value.pause();
  } else {
    audio.value.play();
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function seek(event: Event) {
  if (!audio.value) return;
  const target = event.target as HTMLInputElement;
  audio.value.currentTime = parseFloat(target.value);
}

onUnmounted(() => {
  if (audio.value) {
    audio.value.pause();
    audio.value.src = '';
  }
});
</script>

<template>
  <div class="audio-player">
    <audio v-if="audioUrl" :ref="setupAudio" :src="audioUrl" preload="metadata"></audio>

    <div class="player-controls">
      <button class="play-button" :disabled="!audioUrl" @click="togglePlay">
        <span v-if="isPlaying">&#x23F8;</span>
        <span v-else>&#x25B6;</span>
      </button>

      <div class="progress-container">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          class="progress-bar"
          :value="currentTime"
          :max="duration || 0"
          :disabled="!audioUrl"
          @input="seek"
        />
        <span class="time">{{ formatTime(duration) }}</span>
      </div>

      <div class="speed-control">
        <label for="speed">Speed:</label>
        <select id="speed" v-model="currentSpeed">
          <option v-for="speed in speedOptions" :key="speed" :value="speed">{{ speed }}x</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-player {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.play-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
}

.play-button:not(:disabled):hover {
  transform: scale(1.05);
}

.play-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time {
  font-size: 0.875rem;
  color: #666;
  min-width: 40px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
}

.progress-bar::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.progress-bar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.speed-control label {
  font-size: 0.875rem;
  color: #666;
}

.speed-control select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}
</style>
