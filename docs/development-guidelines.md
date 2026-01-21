# 開発ガイドライン (Development Guidelines)

## コーディング規約

### 命名規則

#### 変数・関数

**TypeScript**:
```typescript
// ✅ 良い例
const userSessionData = await fetchSession();
function calculateFeedbackScore(spoken: string, corrected: string): number { }
const isRecording = true;
const hasAudioPermission = false;

// ❌ 悪い例
const data = fetch();
const flag = true;
function calc(s: string, c: string): number { }
```

**原則**:
- 変数: camelCase、名詞または名詞句
- 関数: camelCase、動詞で始める
- 定数: UPPER_SNAKE_CASE
- Boolean: `is`, `has`, `should`, `can`で始める

#### クラス・インターフェース

```typescript
// クラス: PascalCase、名詞 + 役割接尾辞
class TextGenService { }
class OpenAIClient { }
class FileStorage { }

// インターフェース: PascalCase
interface LearningSession { }
interface Feedback { }
interface NewsInput { }

// 型エイリアス: PascalCase
type AudioPlaybackSpeed = 0.5 | 0.8 | 1.0 | 1.2 | 1.5;
type SessionStatus = 'input' | 'understand' | 'speak' | 'reflect' | 'completed';
```

#### Vue.js固有の命名

```typescript
// コンポーネント: PascalCase
// HomeView.vue, AudioPlayer.vue, LoadingSpinner.vue

// Composable: use + PascalCase
// useAudioRecorder.ts, useApi.ts, useAudioPlayer.ts

// Store: camelCase
// session.ts → useSessionStore

// Props/Emits: camelCase
const props = defineProps<{
  audioUrl: string;
  playbackSpeed: number;
}>();

const emit = defineEmits<{
  (e: 'update:playbackSpeed', speed: number): void;
  (e: 'playbackEnded'): void;
}>();
```

### コードフォーマット

**インデント**: 2スペース

**行の長さ**: 最大100文字

**Prettier設定**:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### コメント規約

**関数・クラスのドキュメント（TSDoc）**:
```typescript
/**
 * ニュース記事から3レベルのテキストを生成する
 *
 * @param articleContent - 元のニュース記事本文
 * @returns Level 1/2/3の生成テキスト
 * @throws {OpenAIError} API呼び出しに失敗した場合
 *
 * @example
 * ```typescript
 * const texts = await textGenService.generateLevels(article);
 * console.log(texts.level1); // 簡単な英語
 * ```
 */
async generateLevels(articleContent: string): Promise<GeneratedTexts> {
  // 実装
}
```

**インラインコメント**:
```typescript
// ✅ 良い例: なぜそうするかを説明
// OpenAI APIのレート制限を避けるため、Level 1/2は並列で生成
const [level1, level2] = await Promise.all([
  this.generateLevel1(content),
  this.generateLevel2(content),
]);

// ❌ 悪い例: 何をしているか（コードを見れば分かる）
// Level 1とLevel 2を並列で生成する
const [level1, level2] = await Promise.all([...]);
```

### エラーハンドリング

**原則**:
- 予期されるエラー: 適切なエラークラスを定義
- 予期しないエラー: 上位に伝播
- エラーを無視しない

**カスタムエラークラス**:
```typescript
// packages/shared/src/types/errors.ts

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
```

**エラーハンドリングパターン**:
```typescript
// サービス層
async generateFeedback(article: string, spoken: string): Promise<Feedback> {
  try {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [/* ... */],
    });

    return this.parseFeedbackResponse(response);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new OpenAIError(
        'フィードバック生成に失敗しました',
        error.status,
        error
      );
    }
    throw error;
  }
}

// API層
app.post('/api/feedback/generate', async (c) => {
  try {
    const { articleContent, spokenText } = await c.req.json();
    const feedback = await feedbackService.generateFeedback(articleContent, spokenText);
    return c.json(feedback);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    if (error instanceof OpenAIError) {
      return c.json({ error: 'AIサービスに接続できません' }, 503);
    }
    console.error('予期しないエラー:', error);
    return c.json({ error: '内部エラーが発生しました' }, 500);
  }
});
```

### 非同期処理

**async/awaitの使用**:
```typescript
// ✅ 良い例: async/await
async function processLearningSession(sessionId: string): Promise<void> {
  const session = await sessionStore.get(sessionId);
  const feedback = await feedbackService.generate(session);
  await logService.save(session, feedback);
}

// ❌ 悪い例: Promiseチェーン
function processLearningSession(sessionId: string): Promise<void> {
  return sessionStore.get(sessionId)
    .then(session => feedbackService.generate(session))
    .then(feedback => logService.save(session, feedback));
}
```

**並列処理**:
```typescript
// ✅ 良い例: 独立した処理は並列実行
async function generateAllContent(article: string): Promise<{
  texts: GeneratedTexts;
  question: string;
}> {
  const [texts, question] = await Promise.all([
    textGenService.generateLevels(article),
    speakingQuestionService.generateQuestion(article),
  ]);
  return { texts, question };
}
```

## Git運用ルール

### ブランチ戦略

**ブランチ種別**:
- `main`: 本番環境にデプロイ可能な状態
- `develop`: 開発の最新状態（統合ブランチ）
- `feature/[機能名]`: 新機能開発
- `fix/[修正内容]`: バグ修正
- `refactor/[対象]`: リファクタリング

**フロー**:
```
main
  └─ develop
      ├─ feature/implement-mvp
      ├─ feature/add-history-view
      ├─ fix/audio-recording
      └─ refactor/api-routes
```

**運用ルール**:
- `main`: 直接コミット禁止。developからのPRのみ
- `develop`: 直接コミット禁止。feature/fix/refactorからのPRのみ
- feature/fix/refactor: developから分岐し、完了後にPRでdevelopへマージ

### コミットメッセージ規約

**フォーマット（Conventional Commits）**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加・修正
- `chore`: ビルド、補助ツール等

**Scope（本プロジェクト固有）**:
- `frontend`: フロントエンド全般
- `backend`: バックエンド全般
- `shared`: 共有型定義
- `input`: 入力機能
- `understand`: 理解フェーズ
- `speak`: スピーキングフェーズ
- `reflect`: フィードバックフェーズ
- `log`: ログ機能
- `tts`: 音声合成
- `stt`: 音声認識

**例**:
```
feat(understand): Level 1/2/3テキスト生成機能を実装

OpenAI APIを使用して記事から3レベルのテキストを生成する機能を追加。

- TextGenServiceクラスを実装
- POST /api/text/generate-levels エンドポイントを追加
- フロントエンドにタブ切り替えUIを実装

Closes #12
```

### プルリクエストプロセス

**作成前のチェック**:
- [ ] 全てのテストがパス (`npm run test`)
- [ ] Lintエラーがない (`npm run lint`)
- [ ] 型チェックがパス (`npm run typecheck`)
- [ ] 競合が解決されている

**PRテンプレート**:
```markdown
## 概要
[変更内容の簡潔な説明]

## 変更理由
[なぜこの変更が必要か]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] ユニットテスト追加/更新
- [ ] 手動テスト実施

## スクリーンショット（該当する場合）
[画像]

## 関連Issue
Closes #[Issue番号]
```

## テスト戦略

### テストの種類

#### ユニットテスト

**対象**: 個別の関数・クラス（サービス層中心）

**カバレッジ目標**: 80%（サービス層は90%）

**例**:
```typescript
// packages/backend/src/services/TextGenService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextGenService } from './TextGenService';

describe('TextGenService', () => {
  let service: TextGenService;
  let mockOpenAI: MockOpenAI;

  beforeEach(() => {
    mockOpenAI = createMockOpenAI();
    service = new TextGenService(mockOpenAI);
  });

  describe('generateLevels', () => {
    it('正常な記事からLevel 1/2/3テキストを生成できる', async () => {
      // Given
      const article = 'OpenAI releases new model...';
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '...' } }],
      });

      // When
      const result = await service.generateLevels(article);

      // Then
      expect(result.level1).toBeDefined();
      expect(result.level2).toBeDefined();
      expect(result.level3).toBe(article);
    });

    it('空の記事の場合ValidationErrorをスローする', async () => {
      // Given
      const emptyArticle = '';

      // When/Then
      await expect(
        service.generateLevels(emptyArticle)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

#### 統合テスト

**対象**: APIエンドポイント

**例**:
```typescript
// packages/backend/src/routes/feedback.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';

describe('POST /api/feedback/generate', () => {
  it('正常なリクエストでフィードバックを返す', async () => {
    const response = await app.request('/api/feedback/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleContent: 'Test article...',
        spokenText: 'The article says...',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('spoken');
    expect(data).toHaveProperty('corrected');
    expect(data).toHaveProperty('upgraded');
    expect(data).toHaveProperty('comment');
  });

  it('空のリクエストで400エラーを返す', async () => {
    const response = await app.request('/api/feedback/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
  });
});
```

#### E2Eテスト

**対象**: ユーザーシナリオ全体

**例**:
```typescript
// tests/e2e/learning-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('学習フロー', () => {
  test('ニュース入力から学習完了まで', async ({ page }) => {
    // ホーム画面
    await page.goto('/');
    await page.click('text=今日の学習を始める');

    // 入力画面
    await page.fill('textarea', 'OpenAI releases new model...');
    await page.click('text=学習を開始する');

    // 理解画面
    await expect(page.locator('text=Level 1')).toBeVisible();
    await page.click('text=次へ');

    // スピーキング画面
    await expect(page.locator('text=録音開始')).toBeVisible();
    // 録音のモック処理...
    await page.click('text=次へ');

    // フィードバック画面
    await expect(page.locator('text=あなたの発話')).toBeVisible();
    await page.click('text=今日の学習を完了する');

    // ホーム画面に戻る
    await expect(page).toHaveURL('/');
  });
});
```

### テスト命名規則

**パターン**: 日本語で状況と期待結果を記述

**例**:
```typescript
// ✅ 良い例
it('正常なデータでタスクを作成できる', () => { });
it('タイトルが空の場合ValidationErrorをスローする', () => { });
it('存在しないIDの場合nullを返す', () => { });

// ❌ 悪い例
it('test1', () => { });
it('works', () => { });
it('should work correctly', () => { });
```

### モック・スタブの使用

**原則**:
- 外部依存（OpenAI API、ファイルシステム）はモック化
- ビジネスロジックは実装を使用

**例**:
```typescript
// OpenAI Clientのモック
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
  audio: {
    speech: {
      create: vi.fn(),
    },
    transcriptions: {
      create: vi.fn(),
    },
  },
};

// FileStorageのモック
const mockFileStorage = {
  write: vi.fn(),
  read: vi.fn(),
  exists: vi.fn(),
};
```

## コードレビュー基準

### レビューポイント

**機能性**:
- [ ] 要件を満たしているか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か

**可読性**:
- [ ] 命名が明確か
- [ ] コメントが適切か
- [ ] 複雑なロジックが説明されているか

**保守性**:
- [ ] 重複コードがないか
- [ ] 責務が明確に分離されているか
- [ ] 変更の影響範囲が限定的か

**パフォーマンス**:
- [ ] 不要な計算がないか
- [ ] 並列化できる処理はしているか
- [ ] 適切なデータ構造を使用しているか

**セキュリティ**:
- [ ] 入力検証が適切か
- [ ] 機密情報がハードコードされていないか
- [ ] パストラバーサル攻撃を防止しているか

### レビューコメントの書き方

**優先度の明示**:
- `[必須]`: 修正必須
- `[推奨]`: 修正推奨
- `[提案]`: 検討してほしい
- `[質問]`: 理解のための質問

**例**:
```markdown
[必須] セキュリティ: APIキーがログに出力される可能性があります。
error.messageではなく、カスタムメッセージを使用してください。

[推奨] パフォーマンス: Level 1と2の生成は並列化できます。
Promise.allを使用すると応答時間を短縮できます。

[提案] 可読性: この関数名を`generateTexts`から
`generateMultiLevelTexts`に変更すると意図が明確になりそうです。

[質問] この遅延処理は何のために必要ですか？
```

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | v24.13.0 | https://nodejs.org/ |
| npm | 11.x | Node.jsに同梱 |
| Git | 最新版 | https://git-scm.com/ |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/[user]/daily-english-gym.git
cd daily-english-gym

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.example .env
# .envファイルを編集してOPENAI_API_KEYを設定

# 4. 開発サーバーの起動
npm run dev

# フロントエンド: http://localhost:5173
# バックエンド: http://localhost:3000
```

### 主要なnpmスクリプト

```bash
# 開発
npm run dev              # フロント + バック同時起動
npm run dev:frontend     # フロントエンドのみ
npm run dev:backend      # バックエンドのみ

# テスト
npm run test             # ユニットテスト
npm run test:e2e         # E2Eテスト

# 品質チェック
npm run lint             # ESLint実行
npm run lint:fix         # ESLint自動修正
npm run typecheck        # 型チェック
npm run format           # Prettier実行

# ビルド
npm run build            # 本番ビルド
```

### 推奨VSCode拡張機能

- **Vue - Official**: Vue.js開発サポート
- **TypeScript Vue Plugin (Volar)**: Vue + TypeScript統合
- **ESLint**: リアルタイムLint
- **Prettier**: コードフォーマット
- **Playwright Test**: E2Eテスト実行

### VSCode設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```
