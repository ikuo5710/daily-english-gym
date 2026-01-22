/**
 * TTS（音声合成）関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError, OpenAIError } from '@daily-english-gym/shared';
import type { GenerateTTSRequest } from '@daily-english-gym/shared';
import { generateTTSAudio } from '../services/TTSService.js';

const ttsRoutes = new Hono();

/**
 * POST /api/tts/generate
 * テキストから音声を生成
 */
ttsRoutes.post('/generate', async (c) => {
  try {
    const body = await c.req.json<GenerateTTSRequest>();

    const audioBuffer = await generateTTSAudio(body.text);

    // audio/mpeg バイナリとして返す
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    if (error instanceof OpenAIError) {
      console.error('OpenAI TTS error:', error);
      return c.json({ error: 'AIサービスに接続できません。しばらく待ってから再試行してください。' }, 503);
    }
    console.error('TTS error:', error);
    return c.json({ error: 'Failed to generate audio' }, 500);
  }
});

export { ttsRoutes };
