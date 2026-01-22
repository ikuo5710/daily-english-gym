# Daily AI News English Gym

AIニュースで毎日英語スピーキング力を鍛えるWebアプリケーション。

## 概要

IT/AIニュースを題材に、以下の4ステップで英語スピーキング力を向上させます:

1. **Input** - 学習したいニュース記事を入力
2. **Understand** - 3レベルのテキスト（簡単→原文）で内容を理解
3. **Speak** - AIが生成した質問に英語で回答・録音
4. **Reflect** - AIからのフィードバックで表現力を向上

## 主な機能

- ニュース記事を3段階の難易度（Level 1/2/3）に変換
- Level 2テキストの音声読み上げ（TTS）
- 音声録音と文字起こし
- AIによるフィードバック（修正版・IT業界表現版・日本語アドバイス）
- 学習ログのMarkdown保存

## 技術スタック

| 分類 | 技術 |
|------|------|
| 言語 | TypeScript 5.x |
| ランタイム | Node.js v24.13.0 |
| フロントエンド | Vue.js 3.x, Vite 5.x, Pinia |
| バックエンド | Hono 4.x |
| AI | OpenAI API (GPT-5.2, TTS, Transcribe) |

## セットアップ

### 必要条件

- Node.js v24.13.0以上
- OpenAI APIキー

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/ikuo5710/daily-english-gym.git
cd daily-english-gym

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してOPENAI_API_KEYを設定
```

### 起動

```bash
# 開発サーバー起動（フロント + バック同時）
npm run dev

# フロントエンド: http://localhost:5173
# バックエンド: http://localhost:3000
```

### その他のコマンド

```bash
npm run build        # 本番ビルド
npm run test         # テスト実行
npm run lint         # ESLint実行
```

## プロジェクト構造

```
daily-english-gym/
├── packages/
│   ├── frontend/    # Vue.js SPA
│   ├── backend/     # Hono API
│   └── shared/      # 共有型定義
├── logs/            # 学習ログ保存先
└── docs/            # 設計ドキュメント
```

## ドキュメント

- [PRD](docs/product-requirements.md) - プロダクト要求定義
- [機能設計書](docs/functional-design.md) - システム構成、API設計
- [アーキテクチャ設計書](docs/architecture.md) - 技術スタック、レイヤー構成
- [リポジトリ構造](docs/repository-structure.md) - ディレクトリ構成、命名規則
- [開発ガイドライン](docs/development-guidelines.md) - コーディング規約、Git運用
- [用語集](docs/glossary.md) - ドメイン用語、技術用語

## ライセンス

MIT
