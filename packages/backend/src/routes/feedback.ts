/**
 * フィードバック関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError, OpenAIError } from '@daily-english-gym/shared';
import type { GenerateFeedbackRequest, GenerateFeedbackResponse } from '@daily-english-gym/shared';
import { generateFeedback } from '../services/FeedbackService.js';

const feedbackRoutes = new Hono();

/**
 * POST /api/feedback/generate
 * スピーキング結果に対するフィードバックを生成
 */
feedbackRoutes.post('/generate', async (c) => {
  try {
    const body = await c.req.json<GenerateFeedbackRequest>();

    const feedback = await generateFeedback(body.articleContent, body.spokenText);

    const response: GenerateFeedbackResponse = feedback;

    return c.json(response);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    if (error instanceof OpenAIError) {
      console.error('OpenAI feedback error:', error);
      return c.json({ error: 'AIサービスに接続できません。しばらく待ってから再試行してください。' }, 503);
    }
    console.error('Feedback generation error:', error);
    return c.json({ error: 'Failed to generate feedback' }, 500);
  }
});

export { feedbackRoutes };
