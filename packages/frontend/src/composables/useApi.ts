import { ref } from 'vue';
import type {
  ParseNewsRequest,
  ParseNewsResponse,
  GenerateLevelsRequest,
  GenerateLevelsResponse,
  GenerateTTSRequest,
  GenerateQuestionRequest,
  GenerateQuestionResponse,
  TranscribeResponse,
  GenerateFeedbackRequest,
  GenerateFeedbackResponse,
  SaveLogRequest,
  SaveLogResponse,
  ErrorResponse,
} from '@daily-english-gym/shared';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new ApiError(
      errorData.error || 'APIリクエストに失敗しました',
      response.status,
      errorData.details
    );
  }

  return response.json() as Promise<T>;
}

export function useApi() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function parseNews(request: ParseNewsRequest): Promise<ParseNewsResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fetchJson<ParseNewsResponse>('/api/news/parse', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function generateLevels(request: GenerateLevelsRequest): Promise<GenerateLevelsResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fetchJson<GenerateLevelsResponse>('/api/text/generate-levels', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function generateTTS(request: GenerateTTSRequest): Promise<Blob> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
        throw new ApiError(
          errorData.error || 'TTS生成に失敗しました',
          response.status,
          errorData.details
        );
      }

      return response.blob();
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function generateQuestion(
    request: GenerateQuestionRequest
  ): Promise<GenerateQuestionResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fetchJson<GenerateQuestionResponse>('/api/speaking/question', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function transcribeSpeech(audioBlob: Blob): Promise<TranscribeResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
        throw new ApiError(
          errorData.error || '音声認識に失敗しました',
          response.status,
          errorData.details
        );
      }

      return response.json() as Promise<TranscribeResponse>;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function generateFeedback(
    request: GenerateFeedbackRequest
  ): Promise<GenerateFeedbackResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fetchJson<GenerateFeedbackResponse>('/api/feedback/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveLog(request: SaveLogRequest): Promise<SaveLogResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fetchJson<SaveLogResponse>('/api/log/save', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    error,
    parseNews,
    generateLevels,
    generateTTS,
    generateQuestion,
    transcribeSpeech,
    generateFeedback,
    saveLog,
  };
}
