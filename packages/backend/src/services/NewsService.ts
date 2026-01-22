/**
 * ニュース記事解析サービス
 */

import { ValidationError } from '@daily-english-gym/shared';

/** 記事の最大文字数 */
const MAX_CONTENT_LENGTH = 10000;

export interface ParsedNews {
  title: string;
  content: string;
  sourceUrl?: string;
}

/**
 * ニュース記事を解析する
 * @param content 記事本文
 */
export function parseNewsContent(content: string): ParsedNews {
  if (!content || content.trim().length === 0) {
    throw new ValidationError('Article content is required', 'content', content);
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError(
      `Article content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`,
      'content',
      content.length
    );
  }

  const trimmedContent = content.trim();
  const lines = trimmedContent.split('\n').filter((line) => line.trim().length > 0);

  // 先頭行または最初の文をタイトルとして抽出
  let title = lines[0] || 'Untitled';

  // タイトルが長すぎる場合は最初の文に切り詰める
  if (title.length > 100) {
    const firstSentence = title.match(/^[^.!?]+[.!?]/);
    title = firstSentence ? firstSentence[0] : title.substring(0, 100) + '...';
  }

  return {
    title: title.trim(),
    content: trimmedContent,
  };
}
