/**
 * APIルート集約
 */

import { Hono } from 'hono';
import { newsRoutes } from './news.js';
import { textRoutes } from './text.js';
import { ttsRoutes } from './tts.js';
import { speakingRoutes } from './speaking.js';
import { speechRoutes } from './speech.js';
import { feedbackRoutes } from './feedback.js';
import { logRoutes } from './log.js';
import { summaryRoutes } from './summary.js';

const routes = new Hono();

// Mount all routes
routes.route('/news', newsRoutes);
routes.route('/text', textRoutes);
routes.route('/tts', ttsRoutes);
routes.route('/speaking', speakingRoutes);
routes.route('/speech', speechRoutes);
routes.route('/feedback', feedbackRoutes);
routes.route('/log', logRoutes);
routes.route('/summary', summaryRoutes);

export { routes };
