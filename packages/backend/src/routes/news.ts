/**
 * ニュース記事関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError } from '@daily-english-gym/shared';
import type { ParseNewsRequest, ParseNewsResponse } from '@daily-english-gym/shared';
import { parseNewsContent, fetchArticleFromUrl } from '../services/NewsService.js';

const newsRoutes = new Hono();

/**
 * POST /api/news/parse
 * 記事を解析してタイトルと本文を抽出
 */
newsRoutes.post('/parse', async (c) => {
  try {
    const body = await c.req.json<ParseNewsRequest>();

    let result;
    if (body.type === 'url') {
      // URL入力: 記事を自動取得
      result = await fetchArticleFromUrl(body.url);
    } else {
      // テキスト入力: そのまま解析
      result = parseNewsContent(body.content);
    }

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
