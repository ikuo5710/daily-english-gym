import { ref, computed, onUnmounted } from 'vue';

export function useAudioRecorder() {
  const isRecording = ref(false);
  const recordingTime = ref(0);
  const audioBlob = ref<Blob | null>(null);
  const audioUrl = ref<string | null>(null);
  const error = ref<string | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;

  const formattedTime = computed(() => {
    const mins = Math.floor(recordingTime.value / 60);
    const secs = recordingTime.value % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  async function startRecording(): Promise<boolean> {
    try {
      error.value = null;
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

        if (audioUrl.value) {
          URL.revokeObjectURL(audioUrl.value);
        }
        audioUrl.value = URL.createObjectURL(blob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      isRecording.value = true;

      timerInterval = setInterval(() => {
        recordingTime.value = Math.floor((Date.now() - startTime) / 1000);
      }, 1000);

      return true;
    } catch (err) {
      error.value = 'マイクへのアクセスが許可されていません';
      console.error('Failed to start recording:', err);
      return false;
    }
  }

  function stopRecording(): void {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stop();
      isRecording.value = false;

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  }

  function resetRecording(): void {
    audioBlob.value = null;
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value);
      audioUrl.value = null;
    }
    recordingTime.value = 0;
    error.value = null;
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

  return {
    isRecording,
    recordingTime,
    formattedTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
