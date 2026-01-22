/**
 * フィードバック関連の型定義
 */

/** フィードバック */
export interface Feedback {
  /** 文字起こし結果（原文） */
  spoken: string;
  /** 意味を保ったまま自然な英語に修正 */
  corrected: string;
  /** IT業界らしい表現に引き上げ */
  upgraded: string;
  /** 日本語での解説（1〜2行） */
  comment: string;
}
