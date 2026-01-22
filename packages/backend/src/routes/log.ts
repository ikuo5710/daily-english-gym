/**
 * ログ保存関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError, FileStorageError } from '@daily-english-gym/shared';
import type { SaveLogRequest, SaveLogResponse } from '@daily-english-gym/shared';
import { saveLog } from '../services/LogService.js';

const logRoutes = new Hono();

/**
 * POST /api/log/save
 * 学習ログを保存
 */
logRoutes.post('/save', async (c) => {
  try {
    const body = await c.req.json<SaveLogRequest>();

    const filePath = await saveLog({
      date: body.date,
      newsTitle: body.newsTitle,
      newsUrl: body.newsUrl,
      spoken: body.spoken,
      corrected: body.corrected,
      upgraded: body.upgraded,
      comment: body.comment,
    });

    const response: SaveLogResponse = {
      success: true,
      filePath,
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    if (error instanceof FileStorageError) {
      console.error('File storage error:', error);
      return c.json({ error: 'ログの保存に失敗しました' }, 500);
    }
    console.error('Log save error:', error);
    return c.json({ error: 'Failed to save log' }, 500);
  }
});

export { logRoutes };
