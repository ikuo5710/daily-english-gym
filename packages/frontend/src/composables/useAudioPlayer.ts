import { ref, onUnmounted } from 'vue';
import type { AudioPlaybackSpeed } from '@daily-english-gym/shared';

export function useAudioPlayer(initialSpeed: AudioPlaybackSpeed = 0.8) {
  const audio = ref<HTMLAudioElement | null>(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const playbackSpeed = ref<AudioPlaybackSpeed>(initialSpeed);
  const error = ref<string | null>(null);

  function initAudio(audioElement: HTMLAudioElement): void {
    audio.value = audioElement;

    audioElement.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.duration;
    });

    audioElement.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.currentTime;
    });

    audioElement.addEventListener('ended', () => {
      isPlaying.value = false;
      currentTime.value = 0;
    });

    audioElement.addEventListener('play', () => {
      isPlaying.value = true;
    });

    audioElement.addEventListener('pause', () => {
      isPlaying.value = false;
    });

    audioElement.addEventListener('error', () => {
      error.value = '音声の読み込みに失敗しました';
    });

    audioElement.playbackRate = playbackSpeed.value;
  }

  function setSource(url: string): void {
    if (audio.value) {
      audio.value.src = url;
      audio.value.playbackRate = playbackSpeed.value;
      error.value = null;
    }
  }

  async function play(): Promise<void> {
    if (audio.value) {
      try {
        await audio.value.play();
      } catch (err) {
        error.value = '音声の再生に失敗しました';
        console.error('Play error:', err);
      }
    }
  }

  function pause(): void {
    if (audio.value) {
      audio.value.pause();
    }
  }

  function togglePlay(): void {
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }
  }

  function seek(time: number): void {
    if (audio.value) {
      audio.value.currentTime = time;
    }
  }

  function setSpeed(speed: AudioPlaybackSpeed): void {
    playbackSpeed.value = speed;
    if (audio.value) {
      audio.value.playbackRate = speed;
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onUnmounted(() => {
    if (audio.value) {
      audio.value.pause();
      audio.value.src = '';
    }
  });

  return {
    audio,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    error,
    initAudio,
    setSource,
    play,
    pause,
    togglePlay,
    seek,
    setSpeed,
    formatTime,
  };
}
