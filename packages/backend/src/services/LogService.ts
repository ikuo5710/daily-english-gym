/**
 * 学習ログ保存サービス
 */

import { ValidationError } from '@daily-english-gym/shared';
import { getLogFilePath, fileExists, appendFile, writeFile } from '../adapters/FileStorage.js';

export interface LogEntry {
  date: string;
  newsTitle: string;
  newsUrl?: string;
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
async function getSessionCount(filePath: string): Promise<number> {
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
