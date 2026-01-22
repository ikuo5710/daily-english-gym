/**
 * ログ保存関連のAPIルート
 */

import { Hono } from 'hono';
import { ValidationError, FileStorageError } from '@daily-english-gym/shared';
import type { SaveLogRequest, SaveLogResponse } from '@daily-english-gym/shared';
import { saveLog, saveAudio, saveTtsAudio, getNextSessionNumber, listLogs, getLogDetail } from '../services/LogService.js';
import { getAudioFilePath, getTtsAudioFilePath, fileExists, readBinaryFile } from '../adapters/FileStorage.js';

const logRoutes = new Hono();

/**
 * POST /api/log/save
 * 学習ログを保存（JSON または multipart/form-data）
 */
logRoutes.post('/save', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';

    let logData: SaveLogRequest;
    let audioFile: File | null = null;
    let ttsAudioFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // FormData形式
      const formData = await c.req.formData();

      logData = {
        date: formData.get('date') as string,
        newsTitle: formData.get('newsTitle') as string,
        newsUrl: (formData.get('newsUrl') as string) || undefined,
        newsContent: formData.get('newsContent') as string,
        speakingQuestion: formData.get('speakingQuestion') as string,
        spoken: formData.get('spoken') as string,
        corrected: formData.get('corrected') as string,
        upgraded: formData.get('upgraded') as string,
        comment: formData.get('comment') as string,
      };

      const audio = formData.get('audio');
      if (audio && audio instanceof File) {
        audioFile = audio;
      }

      const ttsAudio = formData.get('ttsAudio');
      if (ttsAudio && ttsAudio instanceof File) {
        ttsAudioFile = ttsAudio;
      }
    } else {
      // JSON形式（後方互換性）
      logData = await c.req.json<SaveLogRequest>();
    }

    // セッション番号を取得（音声保存用）
    const sessionNumber = await getNextSessionNumber(logData.date);

    // Markdownログを保存
    const filePath = await saveLog({
      date: logData.date,
      newsTitle: logData.newsTitle,
      newsUrl: logData.newsUrl,
      newsContent: logData.newsContent,
      speakingQuestion: logData.speakingQuestion,
      spoken: logData.spoken,
      corrected: logData.corrected,
      upgraded: logData.upgraded,
      comment: logData.comment,
    });

    // 録音音声ファイルがあれば保存
    if (audioFile) {
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await saveAudio(logData.date, sessionNumber, buffer);
    }

    // TTS音声ファイルがあれば保存
    if (ttsAudioFile) {
      const arrayBuffer = await ttsAudioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await saveTtsAudio(logData.date, sessionNumber, buffer);
    }

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

/**
 * GET /api/log/audio/:date/:session
 * 音声ファイルを取得
 */
logRoutes.get('/audio/:date/:session', async (c) => {
  try {
    const date = c.req.param('date');
    const sessionStr = c.req.param('session');

    // パラメータ検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return c.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, 400);
    }

    const session = parseInt(sessionStr, 10);
    if (isNaN(session) || session < 1) {
      return c.json({ error: 'Invalid session number' }, 400);
    }

    const audioPath = getAudioFilePath(date, session);

    // ファイル存在確認
    const exists = await fileExists(audioPath);
    if (!exists) {
      return c.json({ error: 'Audio file not found' }, 404);
    }

    // 音声ファイルを読み込んで返す
    const audioData = await readBinaryFile(audioPath);

    return new Response(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Length': audioData.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof FileStorageError) {
      console.error('File storage error:', error);
      return c.json({ error: 'Failed to read audio file' }, 500);
    }
    console.error('Audio fetch error:', error);
    return c.json({ error: 'Failed to fetch audio' }, 500);
  }
});

/**
 * GET /api/log/tts/:date/:session
 * TTS音声ファイルを取得
 */
logRoutes.get('/tts/:date/:session', async (c) => {
  try {
    const date = c.req.param('date');
    const sessionStr = c.req.param('session');

    // パラメータ検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return c.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, 400);
    }

    const session = parseInt(sessionStr, 10);
    if (isNaN(session) || session < 1) {
      return c.json({ error: 'Invalid session number' }, 400);
    }

    const ttsPath = getTtsAudioFilePath(date, session);

    // ファイル存在確認
    const exists = await fileExists(ttsPath);
    if (!exists) {
      return c.json({ error: 'TTS audio file not found' }, 404);
    }

    // 音声ファイルを読み込んで返す
    const audioData = await readBinaryFile(ttsPath);

    return new Response(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof FileStorageError) {
      console.error('File storage error:', error);
      return c.json({ error: 'Failed to read TTS audio file' }, 500);
    }
    console.error('TTS audio fetch error:', error);
    return c.json({ error: 'Failed to fetch TTS audio' }, 500);
  }
});

/**
 * GET /api/log/list
 * 指定月のログ一覧を取得
 */
logRoutes.get('/list', async (c) => {
  try {
    const yearStr = c.req.query('year');
    const monthStr = c.req.query('month');

    if (!yearStr || !monthStr) {
      return c.json({ error: 'year and month are required' }, 400);
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || year < 2000 || year > 2100) {
      return c.json({ error: 'Invalid year' }, 400);
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return c.json({ error: 'Invalid month' }, 400);
    }

    const logs = await listLogs(year, month);

    return c.json({ logs });
  } catch (error) {
    if (error instanceof FileStorageError) {
      console.error('File storage error:', error);
      return c.json({ error: 'Failed to list logs' }, 500);
    }
    console.error('Log list error:', error);
    return c.json({ error: 'Failed to list logs' }, 500);
  }
});

/**
 * GET /api/log/:date
 * 指定日のログ詳細を取得
 */
logRoutes.get('/:date', async (c) => {
  try {
    const date = c.req.param('date');

    // パラメータ検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return c.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, 400);
    }

    const detail = await getLogDetail(date);

    return c.json(detail);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 404);
    }
    if (error instanceof FileStorageError) {
      console.error('File storage error:', error);
      return c.json({ error: 'Failed to get log detail' }, 500);
    }
    console.error('Log detail error:', error);
    return c.json({ error: 'Failed to get log detail' }, 500);
  }
});

export { logRoutes };
