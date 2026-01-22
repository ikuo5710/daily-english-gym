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
  LogListResponse,
  LogDetailResponse,
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

  /**
   * ログと音声ファイルを一緒に保存する
   */
  async function saveLogWithAudio(
    request: SaveLogRequest,
    audioBlob?: Blob,
    ttsBlob?: Blob
  ): Promise<SaveLogResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('date', request.date);
      formData.append('newsTitle', request.newsTitle);
      if (request.newsUrl) {
        formData.append('newsUrl', request.newsUrl);
      }
      formData.append('newsContent', request.newsContent);
      formData.append('level1Text', request.level1Text);
      formData.append('level2Text', request.level2Text);
      formData.append('speakingQuestion', request.speakingQuestion);
      formData.append('spoken', request.spoken);
      formData.append('corrected', request.corrected);
      formData.append('upgraded', request.upgraded);
      formData.append('comment', request.comment);

      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      if (ttsBlob) {
        formData.append('ttsAudio', ttsBlob, 'tts.mp3');
      }

      const response = await fetch('/api/log/save', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
        throw new ApiError(
          errorData.error || 'ログ保存に失敗しました',
          response.status,
          errorData.details
        );
      }

      return response.json() as Promise<SaveLogResponse>;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 音声ファイルを取得する
   */
  async function getAudioFile(date: string, session: number): Promise<Blob> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`/api/log/audio/${date}/${session}`);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
        throw new ApiError(
          errorData.error || '音声ファイルの取得に失敗しました',
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

  /**
   * TTS音声ファイルを取得する
   */
  async function getTtsAudioFile(date: string, session: number): Promise<Blob> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`/api/log/tts/${date}/${session}`);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
        throw new ApiError(
          errorData.error || 'TTS音声ファイルの取得に失敗しました',
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

  /**
   * ログ一覧を取得する
   */
  async function getLogList(year: number, month: number): Promise<LogListResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fetchJson<LogListResponse>(`/api/log/list?year=${year}&month=${month}`);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '不明なエラーが発生しました';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * ログ詳細を取得する
   */
  async function getLogDetail(date: string): Promise<LogDetailResponse> {
    isLoading.value = true;
    error.value = null;
    try {
      return await fetchJson<LogDetailResponse>(`/api/log/${date}`);
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
    saveLogWithAudio,
    getAudioFile,
    getTtsAudioFile,
    getLogList,
    getLogDetail,
  };
}
