/**
 * 学習ログ保存サービス
 */

import { ValidationError } from '@daily-english-gym/shared';
import {
  getLogFilePath,
  getAudioFilePath,
  getTtsAudioFilePath,
  getMonthDirPath,
  fileExists,
  appendFile,
  writeFile,
  writeBinaryFile,
  readFile,
  listFiles,
} from '../adapters/FileStorage.js';

export interface LogEntry {
  date: string;
  newsTitle: string;
  newsUrl?: string;
  newsContent: string;
  level1Text: string;
  level2Text: string;
  speakingQuestion: string;
  spoken: string;
  corrected: string;
  upgraded: string;
  comment: string;
}

/**
 * 日付が有効な形式かチェック
 */
function isValidDate(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Markdownセクションを生成
 */
function formatLogEntry(entry: LogEntry, sessionNumber: number): string {
  const time = new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let markdown = `\n## Session ${sessionNumber} (${time})\n\n`;
  markdown += `### ${entry.newsTitle}\n\n`;

  if (entry.newsUrl) {
    markdown += `Source: ${entry.newsUrl}\n\n`;
  }

  markdown += `#### News Content (Original)\n\n`;
  markdown += `${entry.newsContent}\n\n`;

  markdown += `#### Level 1 (Easy)\n\n`;
  markdown += `${entry.level1Text}\n\n`;

  markdown += `#### Level 2 (Speaking)\n\n`;
  markdown += `${entry.level2Text}\n\n`;

  markdown += `#### Speaking Question\n\n`;
  markdown += `${entry.speakingQuestion}\n\n`;

  markdown += `#### Your Response\n\n`;
  markdown += `${entry.spoken}\n\n`;

  markdown += `#### Corrected\n\n`;
  markdown += `${entry.corrected}\n\n`;

  markdown += `#### Upgraded\n\n`;
  markdown += `${entry.upgraded}\n\n`;

  markdown += `#### Comment\n\n`;
  markdown += `${entry.comment}\n\n`;

  markdown += `---\n`;

  return markdown;
}

/**
 * 日付ヘッダーを生成
 */
function formatDateHeader(date: string): string {
  const d = new Date(date);
  const formatted = d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `# Daily English Gym - ${formatted}\n`;
}

/**
 * ファイルからセッション数をカウント
 */
export async function getSessionCount(filePath: string): Promise<number> {
  try {
    const { readFile } = await import('../adapters/FileStorage.js');
    const content = await readFile(filePath);
    const matches = content.match(/## Session \d+/g);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

/**
 * 日付からセッション番号を取得（次のセッション番号）
 */
export async function getNextSessionNumber(date: string): Promise<number> {
  const filePath = getLogFilePath(date);
  const count = await getSessionCount(filePath);
  return count + 1;
}

/**
 * 学習ログを保存する
 * @param entry ログエントリ
 * @returns 保存先ファイルパス
 */
export async function saveLog(entry: LogEntry): Promise<string> {
  if (!entry.date || !isValidDate(entry.date)) {
    throw new ValidationError('Invalid date format (expected YYYY-MM-DD)', 'date', entry.date);
  }

  if (!entry.newsTitle || entry.newsTitle.trim().length === 0) {
    throw new ValidationError('News title is required', 'newsTitle', entry.newsTitle);
  }

  if (!entry.spoken || entry.spoken.trim().length === 0) {
    throw new ValidationError('Spoken text is required', 'spoken', entry.spoken);
  }

  const filePath = getLogFilePath(entry.date);
  const exists = await fileExists(filePath);

  if (exists) {
    // 既存ファイルに追記
    const sessionCount = await getSessionCount(filePath);
    const logContent = formatLogEntry(entry, sessionCount + 1);
    await appendFile(filePath, logContent);
  } else {
    // 新規ファイル作成
    const header = formatDateHeader(entry.date);
    const logContent = formatLogEntry(entry, 1);
    await writeFile(filePath, header + logContent);
  }

  return filePath;
}

/**
 * 録音音声ファイルを保存する
 * @param date YYYY-MM-DD形式
 * @param sessionNumber セッション番号
 * @param audioData 音声データ
 * @returns 保存先ファイルパス
 */
export async function saveAudio(
  date: string,
  sessionNumber: number,
  audioData: Buffer
): Promise<string> {
  if (!date || !isValidDate(date)) {
    throw new ValidationError('Invalid date format (expected YYYY-MM-DD)', 'date', date);
  }

  if (sessionNumber < 1) {
    throw new ValidationError('Session number must be positive', 'sessionNumber', sessionNumber);
  }

  const filePath = getAudioFilePath(date, sessionNumber);
  await writeBinaryFile(filePath, audioData);

  return filePath;
}

/**
 * TTS音声ファイルを保存する
 * @param date YYYY-MM-DD形式
 * @param sessionNumber セッション番号
 * @param audioData 音声データ
 * @returns 保存先ファイルパス
 */
export async function saveTtsAudio(
  date: string,
  sessionNumber: number,
  audioData: Buffer
): Promise<string> {
  if (!date || !isValidDate(date)) {
    throw new ValidationError('Invalid date format (expected YYYY-MM-DD)', 'date', date);
  }

  if (sessionNumber < 1) {
    throw new ValidationError('Session number must be positive', 'sessionNumber', sessionNumber);
  }

  const filePath = getTtsAudioFilePath(date, sessionNumber);
  await writeBinaryFile(filePath, audioData);

  return filePath;
}

/** ログ一覧のサマリー */
export interface LogSummary {
  date: string;
  sessionCount: number;
  hasAudio: boolean;
}

/** セッション詳細 */
export interface SessionDetail {
  sessionNumber: number;
  hasRecording: boolean;
  hasTts: boolean;
}

/** ログ詳細レスポンス */
export interface LogDetailData {
  date: string;
  content: string;
  sessions: SessionDetail[];
}

/**
 * 指定月のログ一覧を取得
 */
export async function listLogs(year: number, month: number): Promise<LogSummary[]> {
  const monthDir = getMonthDirPath(year, month);
  const files = await listFiles(monthDir, '.md');

  const summaries: LogSummary[] = [];

  for (const file of files) {
    // ファイル名からdateを抽出 (YYYY-MM-DD.md)
    const date = file.replace('.md', '');
    if (!isValidDate(date)) continue;

    const filePath = getLogFilePath(date);
    const sessionCount = await getSessionCount(filePath);

    // 音声ファイルがあるかチェック（セッション1のみ確認）
    const audioPath = getAudioFilePath(date, 1);
    const hasAudio = await fileExists(audioPath);

    summaries.push({
      date,
      sessionCount,
      hasAudio,
    });
  }

  // 日付の新しい順にソート
  return summaries.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 指定日のログ詳細を取得
 */
export async function getLogDetail(date: string): Promise<LogDetailData> {
  if (!isValidDate(date)) {
    throw new ValidationError('Invalid date format (expected YYYY-MM-DD)', 'date', date);
  }

  const filePath = getLogFilePath(date);
  const exists = await fileExists(filePath);

  if (!exists) {
    throw new ValidationError('Log not found', 'date', date);
  }

  const content = await readFile(filePath);
  const sessionCount = await getSessionCount(filePath);

  const sessions: SessionDetail[] = [];
  for (let i = 1; i <= sessionCount; i++) {
    const recordingPath = getAudioFilePath(date, i);
    const ttsPath = getTtsAudioFilePath(date, i);

    sessions.push({
      sessionNumber: i,
      hasRecording: await fileExists(recordingPath),
      hasTts: await fileExists(ttsPath),
    });
  }

  return {
    date,
    content,
    sessions,
  };
}
