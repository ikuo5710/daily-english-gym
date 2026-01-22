/**
 * 音声認識関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError, OpenAIError } from '@daily-english-gym/shared';
import type { TranscribeResponse } from '@daily-english-gym/shared';
import { transcribeSpeech } from '../services/SpeechService.js';

const speechRoutes = new Hono();

/**
 * POST /api/speech/transcribe
 * 音声ファイルを文字起こし
 * Content-Type: multipart/form-data
 */
speechRoutes.post('/transcribe', async (c) => {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return c.json({ error: 'Audio file is required' }, 400);
    }

    // File を Buffer に変換
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await transcribeSpeech(buffer, audioFile.name);

    const response: TranscribeResponse = {
      text,
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    if (error instanceof OpenAIError) {
      console.error('OpenAI transcription error:', error);
      return c.json({ error: 'AIサービスに接続できません。しばらく待ってから再試行してください。' }, 503);
    }
    console.error('Speech transcription error:', error);
    return c.json({ error: 'Failed to transcribe audio' }, 500);
  }
});

export { speechRoutes };
