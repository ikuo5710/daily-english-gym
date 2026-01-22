/**
 * スピーキング関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError, OpenAIError } from '@daily-english-gym/shared';
import type { GenerateQuestionRequest, GenerateQuestionResponse } from '@daily-english-gym/shared';
import { generateSpeakingQuestion } from '../services/SpeakingQuestionService.js';

const speakingRoutes = new Hono();

/**
 * POST /api/speaking/question
 * ニュース記事に基づいてスピーキング質問を生成
 */
speakingRoutes.post('/question', async (c) => {
  try {
    const body = await c.req.json<GenerateQuestionRequest>();

    const question = await generateSpeakingQuestion(body.content);

    const response: GenerateQuestionResponse = {
      question,
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    if (error instanceof OpenAIError) {
      console.error('OpenAI error:', error);
      return c.json({ error: 'AIサービスに接続できません。しばらく待ってから再試行してください。' }, 503);
    }
    console.error('Speaking question error:', error);
    return c.json({ error: 'Failed to generate speaking question' }, 500);
  }
});

export { speakingRoutes };
