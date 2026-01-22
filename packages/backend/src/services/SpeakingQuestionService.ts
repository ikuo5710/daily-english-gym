/**
 * スピーキング質問生成サービス
 */

import { ValidationError } from '@daily-english-gym/shared';
import { generateChatCompletion } from '../adapters/OpenAIClient.js';
import { QUESTION_SYSTEM_PROMPT, createQuestionUserPrompt } from '../prompts/question.js';
import { withRetry } from '../utils/retry.js';

/**
 * ニュース記事に基づいてスピーキング質問を生成する
 * @param articleContent 元のニュース記事本文
 * @returns 生成された質問
 */
export async function generateSpeakingQuestion(articleContent: string): Promise<string> {
  if (!articleContent || articleContent.trim().length === 0) {
    throw new ValidationError('Article content is required', 'content', articleContent);
  }

  const question = await withRetry(() =>
    generateChatCompletion(QUESTION_SYSTEM_PROMPT, createQuestionUserPrompt(articleContent), {
      temperature: 0.8, // 質問のバリエーションを出すため少し高め
    })
  );

  // 質問が?で終わっていなければ追加
  const trimmedQuestion = question.trim();
  return trimmedQuestion.endsWith('?') ? trimmedQuestion : trimmedQuestion + '?';
}
