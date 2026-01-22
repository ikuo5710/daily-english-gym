/**
 * 学習セッション関連の型定義
 */

/** ニュース入力情報 */
export interface NewsInput {
  /** 入力タイプ */
  type: 'text' | 'url';
  /** 記事本文またはURL */
  content: string;
  /** 記事タイトル（自動抽出） */
  title?: string;
  /** 元記事URL（URL入力の場合） */
  sourceUrl?: string;
}

/** 生成テキスト（3レベル） */
export interface GeneratedTexts {
  /** 超平易な英語（中学英語レベル） */
  level1: string;
  /** スピーキング用の整理された英語 */
  level2: string;
  /** 原文そのまま */
  level3: string;
  /** Level 2のTTS音声URL */
  level2AudioUrl?: string;
}

/** 録音情報 */
export interface Recording {
  /** 録音時間（秒） */
  duration: number;
  /** 録音日時 */
  recordedAt: Date;
  /** 保存先パス（永久保存時） */
  filePath?: string;
}

/** 学習セッション */
export interface LearningSession {
  /** UUID v4 */
  id: string;
  /** YYYY-MM-DD形式 */
  date: string;
  /** ニュース入力情報 */
  newsInput: NewsInput;
  /** 生成された3レベルテキスト */
  generatedTexts?: GeneratedTexts;
  /** スピーキング質問 */
  speakingQuestion?: string;
  /** 録音情報 */
  recording?: Recording;
  /** セッション開始日時 */
  createdAt: Date;
  /** セッション完了日時 */
  completedAt?: Date;
}

/** セッション状態 */
export type SessionStatus = 'input' | 'understand' | 'speak' | 'reflect' | 'completed';

/** 音声再生速度 */
export type AudioPlaybackSpeed = 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0 | 1.1 | 1.2 | 1.3 | 1.4 | 1.5;
