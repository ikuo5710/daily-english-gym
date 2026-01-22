/**
 * ログ関連の型定義
 */

/** ログセッション（1回の学習記録） */
export interface LogSession {
  /** その日の何回目のセッションか */
  sessionNumber: number;
  /** ニュースタイトル */
  newsTitle: string;
  /** ニュースURL（あれば） */
  newsUrl?: string;
  /** 自分の発話（原文） */
  spoken: string;
  /** 修正版 */
  corrected: string;
  /** IT表現版 */
  upgraded: string;
  /** 解説コメント */
  comment: string;
  /** 音声ファイルパス */
  audioFilePath?: string;
  /** 完了日時 */
  completedAt: Date;
}

/** ログエントリ（1日分のログ） */
export interface LogEntry {
  /** YYYY-MM-DD形式 */
  date: string;
  /** その日の学習セッション一覧 */
  sessions: LogSession[];
}
