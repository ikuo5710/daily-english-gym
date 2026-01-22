/**
 * API リクエスト/レスポンス型定義
 */

import type { Feedback } from './feedback.js';
import type { GeneratedTexts } from './session.js';

// ==================== News API ====================

/** POST /api/news/parse リクエスト（テキスト入力） */
export interface ParseNewsTextRequest {
  type: 'text';
  content: string;
}

/** POST /api/news/parse リクエスト（URL入力） */
export interface ParseNewsUrlRequest {
  type: 'url';
  url: string;
}

/** POST /api/news/parse リクエスト */
export type ParseNewsRequest = ParseNewsTextRequest | ParseNewsUrlRequest;

/** POST /api/news/parse レスポンス */
export interface ParseNewsResponse {
  title: string;
  content: string;
  sourceUrl?: string;
}

// ==================== Text API ====================

/** POST /api/text/generate-levels リクエスト */
export interface GenerateLevelsRequest {
  content: string;
}

/** POST /api/text/generate-levels レスポンス */
export type GenerateLevelsResponse = GeneratedTexts;

// ==================== TTS API ====================

/** POST /api/tts/generate リクエスト */
export interface GenerateTTSRequest {
  text: string;
}

// レスポンスは audio/mpeg バイナリ

// ==================== Speaking API ====================

/** POST /api/speaking/question リクエスト */
export interface GenerateQuestionRequest {
  content: string;
}

/** POST /api/speaking/question レスポンス */
export interface GenerateQuestionResponse {
  question: string;
}

// ==================== Speech API ====================

// POST /api/speech/transcribe リクエスト: multipart/form-data (audio file)

/** POST /api/speech/transcribe レスポンス */
export interface TranscribeResponse {
  text: string;
}

// ==================== Feedback API ====================

/** POST /api/feedback/generate リクエスト */
export interface GenerateFeedbackRequest {
  articleContent: string;
  spokenText: string;
}

/** POST /api/feedback/generate レスポンス */
export type GenerateFeedbackResponse = Feedback;

// ==================== Log API ====================

/** POST /api/log/save リクエスト */
export interface SaveLogRequest {
  date: string;
  newsTitle: string;
  newsUrl?: string;
  newsContent: string;
  speakingQuestion: string;
  spoken: string;
  corrected: string;
  upgraded: string;
  comment: string;
}

/** POST /api/log/save レスポンス */
export interface SaveLogResponse {
  success: boolean;
  filePath: string;
}

/** ログサマリー（一覧表示用） */
export interface LogSummary {
  date: string;
  sessionCount: number;
  hasAudio: boolean;
}

/** GET /api/log/list レスポンス */
export interface LogListResponse {
  logs: LogSummary[];
}

/** セッション詳細 */
export interface SessionDetail {
  sessionNumber: number;
  hasRecording: boolean;
  hasTts: boolean;
}

/** GET /api/log/:date レスポンス */
export interface LogDetailResponse {
  date: string;
  content: string;
  sessions: SessionDetail[];
}

// ==================== Error Response ====================

/** エラーレスポンス */
export interface ErrorResponse {
  error: string;
  details?: string;
}
