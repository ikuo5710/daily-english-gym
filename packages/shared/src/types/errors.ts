/**
 * カスタムエラークラス定義
 */

/** バリデーションエラー */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** OpenAI API関連エラー */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public cause?: Error
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/** ファイルストレージエラー */
export class FileStorageError extends Error {
  constructor(
    message: string,
    public path: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FileStorageError';
  }
}
