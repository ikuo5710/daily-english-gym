/**
 * ファイルストレージアダプター
 * ログファイルや音声ファイルの保存・読み込みを担当
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileStorageError } from '@daily-english-gym/shared';

/** ログディレクトリのベースパス */
const LOGS_BASE_DIR = path.resolve(process.cwd(), 'logs');

/**
 * パストラバーサル攻撃を防止
 */
function sanitizePath(filePath: string): string {
  // 正規化してパストラバーサルを防止
  const normalizedPath = path.normalize(filePath);

  // logsディレクトリ外へのアクセスを防止
  if (!normalizedPath.startsWith(LOGS_BASE_DIR)) {
    throw new FileStorageError(
      'Access denied: path outside logs directory',
      filePath
    );
  }

  return normalizedPath;
}

/**
 * ディレクトリが存在しなければ作成
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new FileStorageError(
      `Failed to create directory: ${dirPath}`,
      dirPath,
      error as Error
    );
  }
}

/**
 * 日付からログファイルパスを生成
 * @param date YYYY-MM-DD形式
 */
export function getLogFilePath(date: string): string {
  const [year, month] = date.split('-');
  const monthDir = `${year}-${month}`;
  return sanitizePath(path.join(LOGS_BASE_DIR, monthDir, `${date}.md`));
}

/**
 * 日付とセッション番号から音声ファイルパスを生成
 * @param date YYYY-MM-DD形式
 * @param sessionNumber セッション番号
 */
export function getAudioFilePath(date: string, sessionNumber: number): string {
  const [year, month] = date.split('-');
  const monthDir = `${year}-${month}`;
  return sanitizePath(
    path.join(LOGS_BASE_DIR, monthDir, `${date}-${sessionNumber}.webm`)
  );
}

/**
 * ファイルを読み込む
 */
export async function readFile(filePath: string): Promise<string> {
  const safePath = sanitizePath(filePath);

  try {
    return await fs.readFile(safePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileStorageError(`File not found: ${safePath}`, safePath);
    }
    throw new FileStorageError(
      `Failed to read file: ${safePath}`,
      safePath,
      error as Error
    );
  }
}

/**
 * ファイルを書き込む（存在しなければ作成、存在すれば上書き）
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const safePath = sanitizePath(filePath);
  const dirPath = path.dirname(safePath);

  await ensureDirectory(dirPath);

  try {
    await fs.writeFile(safePath, content, 'utf-8');
  } catch (error) {
    throw new FileStorageError(
      `Failed to write file: ${safePath}`,
      safePath,
      error as Error
    );
  }
}

/**
 * ファイルに追記
 */
export async function appendFile(
  filePath: string,
  content: string
): Promise<void> {
  const safePath = sanitizePath(filePath);
  const dirPath = path.dirname(safePath);

  await ensureDirectory(dirPath);

  try {
    await fs.appendFile(safePath, content, 'utf-8');
  } catch (error) {
    throw new FileStorageError(
      `Failed to append to file: ${safePath}`,
      safePath,
      error as Error
    );
  }
}

/**
 * ファイルが存在するかチェック
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const safePath = sanitizePath(filePath);

  try {
    await fs.access(safePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * バイナリファイルを書き込む
 */
export async function writeBinaryFile(
  filePath: string,
  content: Buffer | ArrayBuffer
): Promise<void> {
  const safePath = sanitizePath(filePath);
  const dirPath = path.dirname(safePath);

  await ensureDirectory(dirPath);

  try {
    const buffer = Buffer.from(content);
    await fs.writeFile(safePath, buffer);
  } catch (error) {
    throw new FileStorageError(
      `Failed to write binary file: ${safePath}`,
      safePath,
      error as Error
    );
  }
}
