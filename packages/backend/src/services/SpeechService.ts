/**
 * 音声文字起こしサービス
 */

import { ValidationError } from '@daily-english-gym/shared';
import { transcribeAudio } from '../adapters/OpenAIClient.js';
import { withRetry } from '../utils/retry.js';

/** 音声ファイルの最大サイズ（25MB - OpenAI制限） */
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

/**
 * 音声データを文字起こしする
 * @param audioBuffer 音声データ
 * @param filename ファイル名（拡張子から形式を判定）
 * @returns 文字起こし結果
 */
export async function transcribeSpeech(
  audioBuffer: Buffer,
  filename: string = 'recording.webm'
): Promise<string> {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new ValidationError('Audio data is required', 'audio', null);
  }

  if (audioBuffer.length > MAX_AUDIO_SIZE) {
    throw new ValidationError(
      `Audio file exceeds maximum size of ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
      'audio',
      audioBuffer.length
    );
  }

  const text = await withRetry(() => transcribeAudio(audioBuffer, filename));

  return text;
}
