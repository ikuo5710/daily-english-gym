/**
 * テキスト生成関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError, OpenAIError } from '@daily-english-gym/shared';
import type { GenerateLevelsRequest, GenerateLevelsResponse } from '@daily-english-gym/shared';
import { generateLevels } from '../services/TextGenService.js';

const textRoutes = new Hono();

/**
 * POST /api/text/generate-levels
 * 記事から3レベルのテキストを生成
 */
textRoutes.post('/generate-levels', async (c) => {
  try {
    const body = await c.req.json<GenerateLevelsRequest>();

    const result = await generateLevels(body.content);

    const response: GenerateLevelsResponse = result;

    return c.json(response);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    if (error instanceof OpenAIError) {
      console.error('OpenAI error:', error);
      return c.json({ error: 'AIサービスに接続できません。しばらく待ってから再試行してください。' }, 503);
    }
    console.error('Text generation error:', error);
    return c.json({ error: 'Failed to generate text levels' }, 500);
  }
});

export { textRoutes };
