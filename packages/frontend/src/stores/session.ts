import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  LearningSession,
  GeneratedTexts,
  SessionStatus,
  AudioPlaybackSpeed,
} from '@daily-english-gym/shared';
import type { Feedback } from '@daily-english-gym/shared';

export const useSessionStore = defineStore('session', () => {
  // State
  const currentSession = ref<LearningSession | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const audioPlaybackSpeed = ref<AudioPlaybackSpeed>(0.8);

  // 現在のスピーキング質問
  const speakingQuestion = ref<string | null>(null);

  // 録音データ（Blob）
  const recordingBlob = ref<Blob | null>(null);

  // 文字起こし結果
  const transcription = ref<string | null>(null);

  // フィードバック
  const feedback = ref<Feedback | null>(null);

  // Getters
  const sessionStatus = computed<SessionStatus>(() => {
    if (!currentSession.value) return 'input';
    if (currentSession.value.completedAt) return 'completed';
    if (feedback.value) return 'reflect';
    if (recordingBlob.value) return 'reflect';
    if (speakingQuestion.value) return 'speak';
    if (currentSession.value.generatedTexts) return 'understand';
    return 'input';
  });

  const hasSession = computed(() => currentSession.value !== null);

  // Actions
  function startNewSession(articleContent: string): void {
    const now = new Date();
    currentSession.value = {
      id: crypto.randomUUID(),
      date: now.toISOString().split('T')[0] as string,
      newsInput: {
        type: 'text',
        content: articleContent,
      },
      createdAt: now,
    };
    error.value = null;
  }

  function setGeneratedTexts(texts: GeneratedTexts): void {
    if (currentSession.value) {
      currentSession.value.generatedTexts = texts;
    }
  }

  function setSpeakingQuestion(question: string): void {
    speakingQuestion.value = question;
    if (currentSession.value) {
      currentSession.value.speakingQuestion = question;
    }
  }

  function setRecordingBlob(blob: Blob, duration: number): void {
    recordingBlob.value = blob;
    if (currentSession.value) {
      currentSession.value.recording = {
        duration,
        recordedAt: new Date(),
      };
    }
  }

  function setTranscription(text: string): void {
    transcription.value = text;
  }

  function setFeedback(fb: Feedback): void {
    feedback.value = fb;
  }

  function setAudioPlaybackSpeed(speed: AudioPlaybackSpeed): void {
    audioPlaybackSpeed.value = speed;
  }

  function setLoading(loading: boolean): void {
    isLoading.value = loading;
  }

  function setError(err: string | null): void {
    error.value = err;
  }

  function completeSession(): void {
    if (currentSession.value) {
      currentSession.value.completedAt = new Date();
    }
  }

  function resetSession(): void {
    currentSession.value = null;
    speakingQuestion.value = null;
    recordingBlob.value = null;
    transcription.value = null;
    feedback.value = null;
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    currentSession,
    isLoading,
    error,
    audioPlaybackSpeed,
    speakingQuestion,
    recordingBlob,
    transcription,
    feedback,
    // Getters
    sessionStatus,
    hasSession,
    // Actions
    startNewSession,
    setGeneratedTexts,
    setSpeakingQuestion,
    setRecordingBlob,
    setTranscription,
    setFeedback,
    setAudioPlaybackSpeed,
    setLoading,
    setError,
    completeSession,
    resetSession,
  };
});
