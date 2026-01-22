/**
 * ニュース記事関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError } from '@daily-english-gym/shared';
import type { ParseNewsRequest, ParseNewsResponse } from '@daily-english-gym/shared';
import { parseNewsContent } from '../services/NewsService.js';

const newsRoutes = new Hono();

/**
 * POST /api/news/parse
 * 記事を解析してタイトルと本文を抽出
 */
newsRoutes.post('/parse', async (c) => {
  try {
    const body = await c.req.json<ParseNewsRequest>();

    // 現在はテキスト入力のみサポート
    if (body.type === 'url') {
      return c.json({ error: 'URL input is not supported yet' }, 400);
    }

    const result = parseNewsContent(body.content);

    const response: ParseNewsResponse = {
      title: result.title,
      content: result.content,
      sourceUrl: result.sourceUrl,
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    console.error('News parse error:', error);
    return c.json({ error: 'Failed to parse news content' }, 500);
  }
});

export { newsRoutes };
