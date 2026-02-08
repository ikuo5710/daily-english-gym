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

/** TTS APIの最大文字数 */
const MAX_TTS_TEXT_LENGTH = 4096;

/**
 * 生成テキストがTTS API制限を超過している場合、該当レベルを再生成する
 */
async function regenerateIfExceeded(
  text: string,
  systemPrompt: string,
  createUserPrompt: (content: string) => string,
  articleContent: string,
  levelName: string
): Promise<string> {
  if (text.length <= MAX_TTS_TEXT_LENGTH) {
    return text;
  }

  console.warn(
    `${levelName} text exceeded TTS limit (${text.length} chars). Regenerating...`
  );

  const regenerated = await withRetry(() =>
    generateChatCompletion(systemPrompt, createUserPrompt(articleContent), {
      temperature: 0.5, // 再生成時はより保守的に
    })
  );

  if (regenerated.length > MAX_TTS_TEXT_LENGTH) {
    throw new ValidationError(
      `${levelName} text still exceeds TTS limit after regeneration (${regenerated.length} chars)`,
      levelName,
      regenerated.length
    );
  }

  return regenerated;
}

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
  const [level1Raw, level2Raw] = await Promise.all([
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

  // TTS API制限を超過している場合は再生成（1回のみ）
  const [level1, level2] = await Promise.all([
    regenerateIfExceeded(
      level1Raw, LEVEL1_SYSTEM_PROMPT, createLevel1UserPrompt, articleContent, 'level1'
    ),
    regenerateIfExceeded(
      level2Raw, LEVEL2_SYSTEM_PROMPT, createLevel2UserPrompt, articleContent, 'level2'
    ),
  ]);

  return {
    level1,
    level2,
    level3: articleContent, // 原文そのまま
  };
}
