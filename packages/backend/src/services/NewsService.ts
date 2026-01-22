/**
 * ニュース記事解析サービス
 */

import * as cheerio from 'cheerio';
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

/** フェッチのタイムアウト（ミリ秒） */
const FETCH_TIMEOUT = 10000;

/** 最大取得サイズ（バイト） */
const MAX_FETCH_SIZE = 1024 * 1024; // 1MB

/**
 * URLからニュース記事を取得する
 * @param url 記事のURL
 */
export async function fetchArticleFromUrl(url: string): Promise<ParsedNews> {
  // URLバリデーション
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ValidationError('Invalid URL format', 'url', url);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ValidationError('Only HTTP and HTTPS URLs are supported', 'url', url);
  }

  // HTMLを取得
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new ValidationError(`Failed to fetch URL: ${response.status} ${response.statusText}`, 'url', url);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FETCH_SIZE) {
      throw new ValidationError('Article is too large to process', 'url', url);
    }

    html = await response.text();
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new ValidationError('Request timed out', 'url', url);
    }
    throw new ValidationError(`Failed to fetch URL: ${(error as Error).message}`, 'url', url);
  } finally {
    clearTimeout(timeoutId);
  }

  // HTMLをパース
  const $ = cheerio.load(html);

  // タイトルを抽出
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    'Untitled';

  // 記事本文を抽出（優先順位順に試行）
  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content',
    '#content',
  ];

  let articleElement = null;
  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      articleElement = element.first();
      break;
    }
  }

  if (!articleElement) {
    // フォールバック: bodyから抽出
    articleElement = $('body');
  }

  // 不要な要素を削除
  articleElement.find('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .comments').remove();

  // テキストを抽出
  const paragraphs: string[] = [];
  articleElement.find('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) {
      // 短すぎる段落はスキップ
      paragraphs.push(text);
    }
  });

  let content = paragraphs.join('\n\n');

  // 段落が少ない場合はテキスト全体を取得
  if (paragraphs.length < 3) {
    content = articleElement
      .text()
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!content || content.length < 100) {
    throw new ValidationError('Could not extract article content from the URL', 'url', url);
  }

  // 長すぎる場合は切り詰める
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.substring(0, MAX_CONTENT_LENGTH);
  }

  return {
    title: title.trim(),
    content: content.trim(),
    sourceUrl: url,
  };
}
