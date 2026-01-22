/**
 * Text-to-Speech サービス
 */

import { ValidationError } from '@daily-english-gym/shared';
import { generateSpeech } from '../adapters/OpenAIClient.js';
import { withRetry } from '../utils/retry.js';

/** テキストの最大文字数（OpenAI TTS制限） */
const MAX_TEXT_LENGTH = 4096;

/**
 * テキストから音声を生成
 * @param text 読み上げるテキスト
 * @returns 音声データ（ArrayBuffer）
 */
export async function generateTTSAudio(text: string): Promise<ArrayBuffer> {
  if (!text || text.trim().length === 0) {
    throw new ValidationError('Text is required', 'text', text);
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(
      `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
      'text',
      text.length
    );
  }

  return withRetry(() =>
    generateSpeech(text, {
      voice: 'nova', // 女性の声、クリアで聞き取りやすい
      speed: 1.0, // クライアント側で再生速度を調整
    })
  );
}
