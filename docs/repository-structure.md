# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
daily-english-gym/
├── packages/                  # モノレポ: 各パッケージ
│   ├── frontend/              # Vue.js フロントエンド
│   ├── backend/               # Hono バックエンド
│   └── shared/                # 共有型定義
├── logs/                      # 学習ログ保存先
├── docs/                      # プロジェクトドキュメント
├── tests/                     # E2Eテスト
├── .claude/                   # Claude Code設定
├── .steering/                 # ステアリングファイル
├── package.json               # ルートpackage.json
├── tsconfig.json              # ルートTypeScript設定
└── .env                       # 環境変数（gitignore）
```

## ディレクトリ詳細

### packages/ (パッケージディレクトリ)

npm workspacesによるモノレポ構成。各パッケージは独立して開発・テスト可能。

#### packages/frontend/

**役割**: Vue.js SPAフロントエンド

**配置ファイル**:
- `*.vue`: Vueコンポーネント
- `*.ts`: TypeScriptファイル
- `*.css`: スタイルシート

**依存関係**:
- 依存可能: `@daily-english-gym/shared`
- 依存禁止: `@daily-english-gym/backend`

**構造**:
```
packages/frontend/
├── package.json
├── vite.config.ts
├── index.html
├── tsconfig.json
└── src/
    ├── main.ts                # エントリーポイント
    ├── App.vue                # ルートコンポーネント
    ├── router/                # Vue Router設定
    │   └── index.ts
    ├── views/                 # 画面コンポーネント
    │   ├── HomeView.vue
    │   ├── InputView.vue
    │   ├── UnderstandView.vue
    │   ├── SpeakView.vue
    │   └── ReflectView.vue
    ├── components/            # 共通UIコンポーネント
    │   ├── AudioPlayer.vue
    │   ├── AudioRecorder.vue
    │   ├── LoadingSpinner.vue
    │   └── TabSelector.vue
    ├── composables/           # 再利用ロジック
    │   ├── useAudioRecorder.ts
    │   ├── useAudioPlayer.ts
    │   └── useApi.ts
    ├── stores/                # Pinia状態管理
    │   └── session.ts
    ├── types/                 # フロント固有型定義
    │   └── index.ts
    └── styles/                # グローバルスタイル
        └── main.css
```

#### packages/backend/

**役割**: Hono APIバックエンド

**配置ファイル**:
- `*.ts`: TypeScriptファイル

**依存関係**:
- 依存可能: `@daily-english-gym/shared`
- 依存禁止: `@daily-english-gym/frontend`

**構造**:
```
packages/backend/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts               # エントリーポイント
    ├── routes/                # APIルート定義
    │   ├── index.ts           # ルート集約
    │   ├── news.ts            # POST /api/news/*
    │   ├── text.ts            # POST /api/text/*
    │   ├── tts.ts             # POST /api/tts/*
    │   ├── speech.ts          # POST /api/speech/*
    │   ├── feedback.ts        # POST /api/feedback/*
    │   └── log.ts             # POST/GET /api/log/*
    ├── services/              # ビジネスロジック
    │   ├── NewsService.ts
    │   ├── TextGenService.ts
    │   ├── TTSService.ts
    │   ├── SpeechService.ts
    │   ├── FeedbackService.ts
    │   ├── SpeakingQuestionService.ts
    │   └── LogService.ts
    ├── adapters/              # 外部依存アダプター
    │   ├── OpenAIClient.ts    # OpenAI API接続
    │   └── FileStorage.ts     # ファイルシステム操作
    ├── types/                 # バックエンド固有型定義
    │   └── index.ts
    ├── utils/                 # ユーティリティ
    │   ├── retry.ts           # リトライロジック
    │   └── validation.ts      # バリデーション
    └── prompts/               # OpenAIプロンプト定義
        ├── level1.ts
        ├── level2.ts
        ├── question.ts
        └── feedback.ts
```

#### packages/shared/

**役割**: フロント・バック共有の型定義

**配置ファイル**:
- `*.ts`: TypeScript型定義ファイル

**依存関係**:
- 依存可能: なし（独立）
- 依存禁止: `@daily-english-gym/frontend`, `@daily-english-gym/backend`

**構造**:
```
packages/shared/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts               # エクスポート集約
    ├── types/
    │   ├── session.ts         # LearningSession, NewsInput等
    │   ├── feedback.ts        # Feedback型
    │   ├── log.ts             # LogEntry, LogSession型
    │   └── api.ts             # APIリクエスト/レスポンス型
    └── constants/
        └── index.ts           # 共通定数
```

### logs/ (ログディレクトリ)

**役割**: 学習ログと音声ファイルの保存

**構造**:
```
logs/
├── 2025-01/
│   ├── 2025-01-20.md          # Markdownログ
│   ├── 2025-01-20-1.webm      # 音声ファイル（セッション1）
│   ├── 2025-01-20-2.webm      # 音声ファイル（セッション2）
│   ├── 2025-01-21.md
│   └── 2025-01-21-1.webm
└── 2025-02/
    └── ...
```

**命名規則**:
- ログファイル: `YYYY-MM-DD.md`
- 音声ファイル: `YYYY-MM-DD-[セッション番号].webm`
- 月別ディレクトリ: `YYYY-MM/`

### docs/ (ドキュメントディレクトリ)

**配置ドキュメント**:
- `product-requirements.md`: プロダクト要求定義書
- `functional-design.md`: 機能設計書
- `architecture.md`: アーキテクチャ設計書
- `repository-structure.md`: リポジトリ構造定義書（本ドキュメント）
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集

**サブディレクトリ**:
```
docs/
├── ideas/                     # 下書き・アイデア
│   └── initial-requirements.md
├── product-requirements.md
├── functional-design.md
├── architecture.md
├── repository-structure.md
├── development-guidelines.md
└── glossary.md
```

### tests/ (E2Eテストディレクトリ)

**役割**: Playwrightによるエンドツーエンドテスト

**構造**:
```
tests/
├── e2e/
│   ├── learning-flow.spec.ts   # 学習フロー全体
│   ├── input.spec.ts           # 入力画面
│   ├── understand.spec.ts      # 理解画面
│   ├── speak.spec.ts           # スピーキング画面
│   └── reflect.spec.ts         # フィードバック画面
└── playwright.config.ts
```

### .claude/ (Claude Code設定)

**役割**: Claude Codeのカスタマイズ設定

**構造**:
```
.claude/
├── settings.json              # Claude Code設定
├── skills/                    # タスクモード別スキル
│   ├── add-feature/
│   ├── architecture-design/
│   ├── development-guidelines/
│   ├── functional-design/
│   ├── glossary-creation/
│   ├── prd-writing/
│   ├── repository-structure/
│   ├── review-docs/
│   ├── setup-project/
│   └── steering/
└── agents/                    # サブエージェント定義
    ├── doc-reviewer.md
    └── implementation-validator.md
```

### .steering/ (ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md        # 今回の作業の要求内容
    ├── design.md              # 変更内容の設計
    └── tasklist.md            # タスクリスト
```

**命名規則**: `20250121-implement-mvp` 形式

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| Vueコンポーネント | `packages/frontend/src/views/` または `components/` | PascalCase.vue | `HomeView.vue`, `AudioPlayer.vue` |
| Composable | `packages/frontend/src/composables/` | useCamelCase.ts | `useAudioRecorder.ts` |
| Store | `packages/frontend/src/stores/` | camelCase.ts | `session.ts` |
| APIルート | `packages/backend/src/routes/` | kebab-case.ts | `news.ts`, `tts.ts` |
| サービス | `packages/backend/src/services/` | PascalCaseService.ts | `NewsService.ts` |
| アダプター | `packages/backend/src/adapters/` | PascalCase.ts | `OpenAIClient.ts` |
| 型定義 | `packages/*/src/types/` | camelCase.ts | `session.ts`, `api.ts` |
| プロンプト | `packages/backend/src/prompts/` | kebab-case.ts | `level1.ts`, `feedback.ts` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト（フロント） | `packages/frontend/src/**/*.test.ts` | [対象].test.ts | `useAudioRecorder.test.ts` |
| ユニットテスト（バック） | `packages/backend/src/**/*.test.ts` | [対象].test.ts | `NewsService.test.ts` |
| E2Eテスト | `tests/e2e/` | [シナリオ].spec.ts | `learning-flow.spec.ts` |

### 設定ファイル

| ファイル種別 | 配置先 | 例 |
|------------|--------|-----|
| 環境変数 | プロジェクトルート | `.env`, `.env.example` |
| TypeScript設定 | プロジェクトルート & 各パッケージ | `tsconfig.json` |
| Vite設定 | `packages/frontend/` | `vite.config.ts` |
| ESLint設定 | プロジェクトルート | `eslint.config.js` |
| Prettier設定 | プロジェクトルート | `.prettierrc` |
| Playwright設定 | `tests/` | `playwright.config.ts` |

## 命名規則

### ディレクトリ名

| 種別 | 規則 | 例 |
|------|------|-----|
| レイヤーディレクトリ | 複数形、kebab-case | `routes/`, `services/`, `adapters/` |
| 機能ディレクトリ | 単数形、kebab-case | `views/`, `stores/` |
| 日付ディレクトリ | YYYY-MM形式 | `2025-01/`, `2025-02/` |

### ファイル名

| 種別 | 規則 | 例 |
|------|------|-----|
| Vueコンポーネント | PascalCase.vue | `HomeView.vue`, `AudioPlayer.vue` |
| クラスファイル | PascalCase.ts | `NewsService.ts`, `OpenAIClient.ts` |
| Composable | useCamelCase.ts | `useAudioRecorder.ts` |
| 関数ファイル | camelCase.ts | `retry.ts`, `validation.ts` |
| 型定義ファイル | camelCase.ts | `session.ts`, `api.ts` |
| テストファイル | [対象].test.ts / [対象].spec.ts | `NewsService.test.ts` |
| ログファイル | YYYY-MM-DD.md | `2025-01-21.md` |

## 依存関係のルール

### パッケージ間の依存

```
frontend ──────→ shared ←────── backend
    │                              │
    └──────────────────────────────┘
              (直接依存禁止)
```

**許可される依存**:
- `frontend` → `shared` (OK)
- `backend` → `shared` (OK)

**禁止される依存**:
- `frontend` → `backend` (NG)
- `backend` → `frontend` (NG)
- `shared` → `frontend` (NG)
- `shared` → `backend` (NG)

### バックエンド内のレイヤー依存

```
routes/
    ↓ (OK)
services/
    ↓ (OK)
adapters/
```

**禁止される依存**:
- `adapters/` → `services/` (NG)
- `adapters/` → `routes/` (NG)
- `services/` → `routes/` (NG)

### 循環依存の禁止

```typescript
// NG: 循環依存
// TextGenService.ts
import { FeedbackService } from './FeedbackService';

// FeedbackService.ts
import { TextGenService } from './TextGenService';  // 循環依存！
```

**解決策**: 共通インターフェースを `types/` に抽出

## スケーリング戦略

### 機能の追加

新しい機能を追加する際の配置方針:

| 規模 | 方針 | 例 |
|------|------|-----|
| 小規模 | 既存ディレクトリに配置 | 新APIエンドポイント → `routes/` に追加 |
| 中規模 | サブディレクトリ作成 | 履歴機能 → `services/history/` |
| 大規模 | 新パッケージ作成 | モバイルアプリ → `packages/mobile/` |

### ファイルサイズの管理

**ファイル分割の目安**:
- 1ファイル: 300行以下を推奨
- 300-500行: リファクタリングを検討
- 500行以上: 分割を強く推奨

**分割例**:
```typescript
// Before: 1ファイルに全機能
// TextGenService.ts (500行)

// After: 責務ごとに分割
// TextGenService.ts (150行) - メインロジック
// prompts/level1.ts (50行) - Level 1プロンプト
// prompts/level2.ts (50行) - Level 2プロンプト
```

## ルートファイル

### package.json (ルート)

```json
{
  "name": "daily-english-gym",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm run dev -w @daily-english-gym/frontend",
    "dev:backend": "npm run dev -w @daily-english-gym/backend",
    "build": "npm run build -w @daily-english-gym/shared && npm run build --workspaces",
    "test": "npm run test --workspaces",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### tsconfig.json (ルート)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/frontend" },
    { "path": "./packages/backend" }
  ]
}
```

## 除外設定

### .gitignore

```gitignore
# 依存関係
node_modules/

# ビルド成果物
dist/
*.tsbuildinfo

# 環境変数
.env
.env.local

# ログ
*.log
npm-debug.log*

# エディタ
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# テスト
coverage/
playwright-report/
test-results/

# 一時ファイル
*.tmp
*.temp
```

### .prettierignore

```
dist/
node_modules/
coverage/
playwright-report/
logs/
*.md
```

### .eslintignore

```
dist/
node_modules/
coverage/
playwright-report/
```
