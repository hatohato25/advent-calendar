# アドベントカレンダー

[English](README.md) | [日本語](README.ja.md)

エンジニア向けのアドベントカレンダーサイト。12月1日から25日まで毎日記事を公開できる Web アプリケーションです。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)

## 特徴

- 📅 **カレンダー表示**: 12月1日〜25日の記事を見やすく表示
- ✍️ **Markdown エディタ**: リアルタイムプレビュー付きの高機能エディタ（CodeMirror 6）
- 🌓 **ダークモード**: ライト/ダーク/システム設定の3モード切り替え
- 🔒 **認証機能**: NextAuth.js による管理者認証
- 🏷️ **タグ管理**: 記事のカテゴリー分類
- 📤 **エクスポート/インポート**: Markdown ファイルとして記事を管理
- 🎨 **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- ⚡ **高速**: ISR、画像最適化、コード分割による高速表示
- ♿ **アクセシビリティ**: WCAG AA 準拠、キーボードナビゲーション対応

## 技術スタック

### フロントエンド
- **Next.js 16** - React フレームワーク（App Router）
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストの CSS
- **shadcn/ui** - アクセシブルな UI コンポーネント
- **CodeMirror 6** - Markdown エディタ
- **react-markdown** - Markdown レンダリング

### バックエンド
- **Next.js API Routes** - API エンドポイント
- **Prisma ORM** - データベース管理
- **SQLite** (開発環境) / **PostgreSQL** (本番環境)
- **NextAuth.js** - 認証・セッション管理
- **bcrypt** - パスワードハッシュ化
- **Zod** - バリデーション

### 開発ツール
- **Biome** - Linter + Formatter
- **@next/bundle-analyzer** - バンドルサイズ分析
- **Playwright** - スクリーンショット取得・E2E テスト基盤

## セットアップ

### 必要な環境

- Node.js 20 以上
- npm または yarn

### インストール

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/username/advent-calendar.git
   cd advent-calendar
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **環境変数の設定**
   ```bash
   cp .env.example .env.local
   ```

   `.env.local` を編集：
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="development-secret"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="password"
   ADMIN_EMAIL="admin@example.com"
   ```

4. **データベースのセットアップ**
   ```bash
   # マイグレーション実行
   npx prisma migrate dev

   # シードデータ投入（初期管理者 + サンプル記事）
   npx prisma db seed
   ```

5. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

   http://localhost:3000 でアクセス

### 管理画面へのアクセス

- URL: http://localhost:3000/admin/login
- ユーザー名: `admin`（環境変数で設定した値）
- パスワード: `password`（環境変数で設定した値）

## 使い方

### 記事の作成

1. 管理画面にログイン
2. 「新規記事作成」をクリック
3. タイトル、日付（1-25）、コンテンツ（Markdown）、タグ、ステータスを入力
4. 「保存」をクリック

### 記事の編集

1. ダッシュボードまたは記事一覧から記事を選択
2. 編集ページで内容を変更
3. 自動保存が有効（2秒のデバウンス）
4. 「保存」ボタンで手動保存も可能

### 記事のエクスポート/インポート

**エクスポート**:
- 各記事の編集ページで「エクスポート」ボタンをクリック
- Markdown ファイルとしてダウンロード（フロントマター付き）

**インポート**:
- ダッシュボードの「インポート」をクリック
- Markdown ファイルをアップロード
- 既存記事の上書きオプションあり

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# Linter 実行
npm run lint

# Formatter 実行
npm run format

# Linter + Formatter 実行（自動修正）
npm run check

# バンドルサイズ分析
npm run analyze

# データベースマイグレーション
npx prisma migrate dev

# Prisma Studio（GUI）起動
npx prisma studio

# シードデータ投入
npx prisma db seed

# Playwright スクリーンショット取得（デスクトップ・ライト）
npm run debug:screenshot

# Playwright スクリーンショット取得（モバイル・ライト/ダーク）
npm run debug:screenshot:mobile

# Playwright スクリーンショット取得（デスクトップ・ダーク）
npm run debug:screenshot:dark

# Playwright デバッグ用ブラウザ起動
npm run debug:browser

# Playwright ブラウザインストール
npm run playwright:install
```

## Playwright スクリーンショット機能

開発中の画面を視覚的に確認するため、Playwright を使用したスクリーンショット取得機能を提供しています。

### セットアップ

1. **Playwright ブラウザのインストール**
   ```bash
   npm run playwright:install
   ```

### 使い方

**前提条件**: 開発サーバーが起動している必要があります。
```bash
npm run dev
```

#### デスクトップビュー（ライトモード）のスクリーンショット

```bash
npm run debug:screenshot
```

以下のページのスクリーンショットが取得されます：
- カレンダー一覧ページ
- 記事詳細ページ（存在する場合）
- 管理ページログイン画面

保存先: `screenshots/desktop/light/`

#### デスクトップビュー（ダークモード）のスクリーンショット

```bash
npm run debug:screenshot:dark
```

保存先: `screenshots/desktop/dark/`

#### モバイルビュー（ライト/ダーク）のスクリーンショット

```bash
npm run debug:screenshot:mobile
```

Pixel 5 エミュレーションでスクリーンショットを取得します。

保存先:
- ライトモード: `screenshots/mobile/light/`
- ダークモード: `screenshots/mobile/dark/`

#### デバッグ用ブラウザ起動

```bash
npm run debug:browser
```

Playwright ブラウザが起動し、手動で操作できます。デバッグに便利です。

### トラブルシューティング

#### 開発サーバーが起動していない

```
❌ Next.js開発サーバーが起動していません
   `npm run dev` を実行してください
```

**対処法**: 別のターミナルで `npm run dev` を実行し、http://localhost:3000 が起動していることを確認してください。

#### ブラウザが起動しない

```
❌ Error: browserType.launch: Executable doesn't exist
```

**対処法**: Playwright ブラウザをインストールしてください。

```bash
npm run playwright:install
```

#### スクリーンショットが保存されない

**対処法**: `screenshots/` ディレクトリの書き込み権限を確認してください。スクリプトは自動的にディレクトリを作成しますが、権限エラーが発生する場合は手動で作成してください。

```bash
mkdir -p screenshots/desktop/light screenshots/desktop/dark screenshots/mobile/light screenshots/mobile/dark
```

## デプロイ

Vercel へのデプロイ方法は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## ディレクトリ構成

```
advent-calendar/
├── .claude/                # Agent 管理ファイル
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── playwright/             # Playwright スクリプト
│   ├── config.ts           # Playwright 設定
│   ├── scripts/            # スクリーンショット取得スクリプト
│   │   ├── screenshot.ts
│   │   ├── screenshot-dark.ts
│   │   ├── screenshot-mobile.ts
│   │   └── open-browser.ts
│   └── utils/              # ユーティリティ関数
│       ├── server-check.ts
│       └── paths.ts
├── prisma/
│   ├── schema.prisma       # データベーススキーマ
│   ├── migrations/         # マイグレーションファイル
│   └── seed.ts             # シードデータ
├── public/                 # 静的ファイル
├── screenshots/            # スクリーンショット保存先（Git除外）
│   ├── desktop/
│   │   ├── light/
│   │   └── dark/
│   └── mobile/
│       ├── light/
│       └── dark/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (public)/       # 公開ページ
│   │   ├── admin/          # 管理ページ
│   │   └── api/            # API Routes
│   ├── components/         # React コンポーネント
│   │   ├── ui/             # shadcn/ui コンポーネント
│   │   ├── theme/          # テーマ関連
│   │   ├── calendar/       # カレンダー表示
│   │   ├── post/           # 記事表示
│   │   ├── editor/         # Markdown エディタ
│   │   └── layout/         # レイアウト
│   ├── lib/                # ユーティリティ
│   ├── types/              # 型定義
│   └── middleware.ts       # 認証ミドルウェア
├── .env.example            # 環境変数テンプレート
├── .env.production.example # 本番環境変数テンプレート
├── next.config.ts          # Next.js 設定
├── tailwind.config.ts      # Tailwind CSS 設定
├── biome.json              # Biome 設定
└── package.json
```

## トラブルシューティング

### データベース接続エラー

```bash
# Prisma Client を再生成
npx prisma generate

# データベースをリセット（注意: データが消えます）
npx prisma migrate reset
```

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next
npm run build
```

### 型エラー

```bash
# Prisma Client を再生成
npx prisma generate

# TypeScript のキャッシュをクリア
rm -rf node_modules/.cache
```

### ログインできない

- `.env.local` の `ADMIN_USERNAME`, `ADMIN_PASSWORD` を確認
- シードデータが投入されているか確認（`npx prisma db seed`）
- ブラウザの Cookie をクリア

## ライセンス

MIT License

## 貢献

Issue や Pull Request を歓迎します！

1. このリポジトリをフォーク
2. Feature ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

## サポート

問題が発生した場合は、[Issue](https://github.com/username/advent-calendar/issues) を作成してください。
