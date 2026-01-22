/**
 * 3レベルテキスト生成サービス
 */

import { ValidationError } from '@daily-english-gym/shared';
import type { GeneratedTexts } from '@daily-english-gym/shared';
import { generateChatCompletion } from '../adapters/OpenAIClient.js';
import { LEVEL1_SYSTEM_PROMPT, createLevel1UserPrompt } from '../prompts/level1.js';
import { LEVEL2_SYSTEM_PROMPT, createLevel2UserPrompt } from '../prompts/level2.js';
import { withRetry } from '../utils/retry.js';

/** 記事の最大文字数 */
const MAX_CONTENT_LENGTH = 10000;

/**
 * ニュース記事から3レベルのテキストを生成する
 * @param articleContent 元のニュース記事本文
 * @returns Level 1/2/3の生成テキスト
 */
export async function generateLevels(articleContent: string): Promise<GeneratedTexts> {
  if (!articleContent || articleContent.trim().length === 0) {
    throw new ValidationError('Article content is required', 'content', articleContent);
  }

  if (articleContent.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError(
      `Article content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`,
      'content',
      articleContent.length
    );
  }

  // Level 1/2は並列でAPI呼び出し（OpenAI APIのレート制限を考慮しつつ効率化）
  const [level1, level2] = await Promise.all([
    withRetry(() =>
      generateChatCompletion(LEVEL1_SYSTEM_PROMPT, createLevel1UserPrompt(articleContent), {
        temperature: 0.7,
      })
    ),
    withRetry(() =>
      generateChatCompletion(LEVEL2_SYSTEM_PROMPT, createLevel2UserPrompt(articleContent), {
        temperature: 0.7,
      })
    ),
  ]);

  return {
    level1,
    level2,
    level3: articleContent, // 原文そのまま
  };
}
