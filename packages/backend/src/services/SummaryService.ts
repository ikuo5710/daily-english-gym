/**
 * 週間サマリー・連続日数サービス
 */

import type { WeeklyAnalysis } from '@daily-english-gym/shared';
import { generateChatCompletion } from '../adapters/OpenAIClient.js';
import {
  getLogFilePath,
  fileExists,
  readFile,
  listMonthDirectories,
  listFiles,
  getMonthDirPath,
} from '../adapters/FileStorage.js';
import { getSessionCount } from './LogService.js';

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 今週の月曜日を取得（日曜日は前週の最終日）
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // 日曜日(0)は7として扱い、月曜日からの差分を計算
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 今週の日曜日を取得
 */
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * 連続学習日数を計算する
 */
export async function getStreakDays(): Promise<{
  streakDays: number;
  lastLearningDate: string | null;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(today);
  let streakDays = 0;
  let lastLearningDate: string | null = null;
  let foundFirstLog = false;

  // 最大365日遡ってチェック
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(currentDate);
    const logPath = getLogFilePath(dateStr);
    const exists = await fileExists(logPath);

    if (exists) {
      if (!foundFirstLog) {
        lastLearningDate = dateStr;
        foundFirstLog = true;
      }
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // 今日まだ学習していない場合は昨日から開始
      if (i === 0) {
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }
      // 連続が途切れた
      break;
    }
  }

  return { streakDays, lastLearningDate };
}

/**
 * 今週のログファイルを取得
 */
async function getWeeklyLogFiles(
  weekStart: Date,
  weekEnd: Date
): Promise<{ date: string; content: string }[]> {
  const logs: { date: string; content: string }[] = [];

  const currentDate = new Date(weekStart);
  while (currentDate <= weekEnd) {
    const dateStr = formatDate(currentDate);
    const logPath = getLogFilePath(dateStr);

    if (await fileExists(logPath)) {
      const content = await readFile(logPath);
      logs.push({ date: dateStr, content });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return logs;
}

/**
 * ログからトピック（ニュースタイトル）を抽出
 */
function extractTopics(logs: { date: string; content: string }[]): string[] {
  const topics: string[] = [];

  for (const log of logs) {
    // "### タイトル" の形式でタイトルを抽出
    const matches = log.content.match(/^### (.+)$/gm);
    if (matches) {
      for (const match of matches) {
        const title = match.replace('### ', '').trim();
        if (title && !topics.includes(title)) {
          topics.push(title);
        }
      }
    }
  }

  return topics;
}

/**
 * ログからユーザーの発話を抽出
 */
function extractSpokenTexts(logs: { date: string; content: string }[]): string[] {
  const spokenTexts: string[] = [];

  for (const log of logs) {
    // "#### Your Response" セクションの内容を抽出
    const sections = log.content.split('####');
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.includes('Your Response')) {
        // 次のセクションまでのテキストを取得
        const lines = section.split('\n').slice(2); // "Your Response" 行と空行をスキップ
        const text: string[] = [];
        for (const line of lines) {
          if (line.startsWith('#') || line.startsWith('---')) break;
          if (line.trim()) text.push(line.trim());
        }
        if (text.length > 0) {
          spokenTexts.push(text.join(' '));
        }
      }
    }
  }

  return spokenTexts;
}

/**
 * OpenAI APIで週間の表現を分析
 */
export async function analyzeWeeklyExpressions(
  spokenTexts: string[],
  topics: string[]
): Promise<WeeklyAnalysis> {
  if (spokenTexts.length === 0) {
    return {
      commonExpressions: [],
      areasForImprovement: [],
      advice: '今週はまだ学習がありません。ぜひ学習を始めてみましょう！',
    };
  }

  const systemPrompt = `You are an English learning coach analyzing a learner's weekly speaking practice.
Based on the spoken texts provided, analyze:
1. Common expressions the learner uses well
2. Areas that need improvement
3. One encouraging advice for next week

Respond in the following JSON format:
{
  "commonExpressions": ["expression1", "expression2"],
  "areasForImprovement": ["日本語でのアドバイス1", "日本語でのアドバイス2"],
  "advice": "日本語での来週へのアドバイス"
}

Keep commonExpressions in English. Keep areasForImprovement and advice in Japanese.
Limit to 3 items each for expressions and improvements.`;

  const userMessage = `Topics covered this week:
${topics.join('\n')}

Learner's spoken responses this week:
${spokenTexts.map((text, i) => `${i + 1}. ${text}`).join('\n\n')}

Please analyze these responses.`;

  try {
    const response = await generateChatCompletion(systemPrompt, userMessage, {
      temperature: 0.5,
    });

    // JSON部分を抽出
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const analysis = JSON.parse(jsonMatch[0]) as WeeklyAnalysis;
    return analysis;
  } catch (error) {
    // API失敗時のフォールバック
    return {
      commonExpressions: [],
      areasForImprovement: [],
      advice: '分析中にエラーが発生しました。来週もがんばりましょう！',
    };
  }
}

/**
 * 週間サマリーを取得
 */
export async function getWeeklySummary(): Promise<{
  weekStart: string;
  weekEnd: string;
  learningDays: number;
  topics: string[];
  analysis: WeeklyAnalysis | null;
}> {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);

  // 今週のログを取得
  const logs = await getWeeklyLogFiles(weekStart, weekEnd);
  const learningDays = logs.length;

  // トピックを抽出
  const topics = extractTopics(logs);

  // 発話テキストを抽出して分析
  let analysis: WeeklyAnalysis | null = null;
  if (learningDays > 0) {
    const spokenTexts = extractSpokenTexts(logs);
    analysis = await analyzeWeeklyExpressions(spokenTexts, topics);
  }

  return {
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    learningDays,
    topics,
    analysis,
  };
}
