/**
 * 週間サマリー・連続日数 APIルート
 */

import { Hono } from 'hono';
import type { StreakResponse, WeeklySummaryResponse } from '@daily-english-gym/shared';
import { getStreakDays, getWeeklySummary } from '../services/SummaryService.js';

const summaryRoutes = new Hono();

/**
 * GET /streak - 連続学習日数を取得
 */
summaryRoutes.get('/streak', async (c) => {
  try {
    const result = await getStreakDays();
    const response: StreakResponse = {
      streakDays: result.streakDays,
      lastLearningDate: result.lastLearningDate,
    };
    return c.json(response);
  } catch (error) {
    console.error('Error getting streak:', error);
    return c.json(
      { error: '連続日数の取得に失敗しました', details: String(error) },
      500
    );
  }
});

/**
 * GET /weekly - 週間サマリーを取得
 */
summaryRoutes.get('/weekly', async (c) => {
  try {
    const result = await getWeeklySummary();
    const response: WeeklySummaryResponse = {
      weekStart: result.weekStart,
      weekEnd: result.weekEnd,
      learningDays: result.learningDays,
      topics: result.topics,
      analysis: result.analysis,
    };
    return c.json(response);
  } catch (error) {
    console.error('Error getting weekly summary:', error);
    return c.json(
      { error: '週間サマリーの取得に失敗しました', details: String(error) },
      500
    );
  }
});

export { summaryRoutes };
