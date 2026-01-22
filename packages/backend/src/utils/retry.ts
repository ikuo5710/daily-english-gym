/**
 * リトライユーティリティ
 */

import { OpenAIError } from '@daily-english-gym/shared';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  rateLimitDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 1,
  retryDelay: 1000,
  rateLimitDelay: 5000,
};

/**
 * 指定時間待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * リトライ可能なエラーかどうかを判定
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAIError) {
    // レート制限（429）やサーバーエラー（5xx）はリトライ可能
    const statusCode = error.statusCode;
    return statusCode === 429 || (statusCode !== undefined && statusCode >= 500);
  }
  return false;
}

/**
 * 関数をリトライ付きで実行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, retryDelay, rateLimitDelay } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // レート制限エラーの場合は長めに待機
      const delay =
        error instanceof OpenAIError && error.statusCode === 429 ? rateLimitDelay : retryDelay;

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}
