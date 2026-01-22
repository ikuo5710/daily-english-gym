/**
 * フィードバック生成サービス
 */

import { ValidationError, OpenAIError } from '@daily-english-gym/shared';
import type { Feedback } from '@daily-english-gym/shared';
import { generateChatCompletion } from '../adapters/OpenAIClient.js';
import { FEEDBACK_SYSTEM_PROMPT, createFeedbackUserPrompt } from '../prompts/feedback.js';
import { withRetry } from '../utils/retry.js';

interface FeedbackResponse {
  corrected: string;
  upgraded: string;
  comment: string;
}

/**
 * スピーキング結果に対するフィードバックを生成する
 * @param articleContent 元のニュース記事本文
 * @param spokenText ユーザーの発話テキスト
 * @returns フィードバック
 */
export async function generateFeedback(
  articleContent: string,
  spokenText: string
): Promise<Feedback> {
  if (!articleContent || articleContent.trim().length === 0) {
    throw new ValidationError('Article content is required', 'articleContent', articleContent);
  }

  if (!spokenText || spokenText.trim().length === 0) {
    throw new ValidationError('Spoken text is required', 'spokenText', spokenText);
  }

  const response = await withRetry(() =>
    generateChatCompletion(
      FEEDBACK_SYSTEM_PROMPT,
      createFeedbackUserPrompt(articleContent, spokenText),
      {
        temperature: 0.7,
      }
    )
  );

  // JSON をパース
  let feedbackData: FeedbackResponse;
  try {
    // マークダウンコードブロックを除去
    const jsonString = response.replace(/```json\n?|\n?```/g, '').trim();
    feedbackData = JSON.parse(jsonString);
  } catch {
    throw new OpenAIError('Failed to parse feedback response as JSON');
  }

  // バリデーション
  if (!feedbackData.corrected || !feedbackData.upgraded || !feedbackData.comment) {
    throw new OpenAIError('Incomplete feedback response');
  }

  return {
    spoken: spokenText,
    corrected: feedbackData.corrected,
    upgraded: feedbackData.upgraded,
    comment: feedbackData.comment,
  };
}
