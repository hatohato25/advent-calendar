# デプロイメントガイド

このドキュメントでは、アドベントカレンダーアプリケーションをVercelにデプロイする際の設定について説明します。

## ⚠️ 重要: データベース設定について

本アプリケーションは、**環境によってデータベースを自動的に切り替える**仕組みを採用しています：

- **ローカル環境**: SQLite (`file:./dev.db`)
- **本番環境 (Vercel)**: PostgreSQL (Neon Serverless)

### 仕組み

ビルド時に環境変数 `DATABASE_URL` の値に応じて、`prisma/schema.prisma` のプロバイダーが自動的に書き換わります：

1. **ビルド前スクリプト** (`scripts/prepare-schema.js`) が実行される
2. `DATABASE_URL` が `postgresql://` で始まる場合 → `provider = "postgresql"`
3. `DATABASE_URL` が `file:` で始まる場合 → `provider = "sqlite"`
4. その後、`prisma generate` が実行され、適切なPrisma Clientが生成される
5. 実行時は `src/lib/prisma.ts` で適切なアダプター (`PrismaNeon` または `PrismaLibSql`) が選択される

### 注意点

- `prisma/schema.prisma` は**gitにコミットされるとき**は `provider = "sqlite"` の状態です
- ビルド時に自動的に書き換わるため、手動で変更する必要はありません
- ローカル開発では自動的にSQLiteが使用されます

## 必須環境変数

Vercelのプロジェクト設定で、以下の環境変数を設定してください。

### 1. DATABASE_URL (必須)

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

**Neon PostgreSQLの接続文字列を使用してください**

- [Neon](https://neon.tech/) でプロジェクトを作成
- ダッシュボードから接続文字列を取得
- 形式: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`
- 例: `postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

> **重要**: Neon Serverless Driverを使用するため、必ず **Neon PostgreSQL** を使用してください。
> 通常のPostgreSQLでは動作しません（`@prisma/adapter-neon` の制約）。

### 2. NEXTAUTH_URL (必須)

```bash
NEXTAUTH_URL="https://your-app-name.vercel.app"
```

- デプロイされたアプリケーションのURL
- 本番環境のドメインを設定 (例: `https://advent-calendar.vercel.app`)

### 3. NEXTAUTH_SECRET (必須)

```bash
NEXTAUTH_SECRET="<ランダムな長い文字列>"
```

- 暗号化用のシークレットキー
- 強固なランダム文字列を生成してください
- 生成方法: `openssl rand -base64 32`

### 4. 管理者アカウント (必須)

```bash
ADMIN_USERNAME="admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="<強固なパスワード>"
```

- **ADMIN_USERNAME**: アプリケーション内での表示名
- **ADMIN_EMAIL**: ログイン時のIDとして使用
- **ADMIN_PASSWORD**: ログイン時のパスワード（強固なものを設定）

## Vercel環境変数の設定手順

### 方法1: Vercel CLI を使用

```bash
# Vercelプロジェクトにログイン
vercel login

# 環境変数を設定
vercel env add DATABASE_URL production
# プロンプトでNeon PostgreSQLの接続文字列を入力

vercel env add NEXTAUTH_URL production
# プロンプトで本番URLを入力

vercel env add NEXTAUTH_SECRET production
# プロンプトでシークレットを入力

vercel env add ADMIN_USERNAME production
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PASSWORD production
```

### 方法2: Vercel Dashboard を使用

1. [Vercelダッシュボード](https://vercel.com/dashboard)でプロジェクトを選択
2. **Settings** → **Environment Variables** に移動
3. 各環境変数を追加:
   - 変数名を入力
   - 値を入力
   - 環境を選択 (Production, Preview, Development)
   - **Add** をクリック

## データベースマイグレーション

Vercelへの初回デプロイ後、データベースマイグレーションを実行する必要があります。

### 推奨方法: ローカルから実行

```bash
# 1. Vercel環境変数を取得
vercel env pull .env.production

# 2. .env.productionからDATABASE_URLを抽出して実行
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')" npx prisma migrate deploy

# 3. シードデータを投入（初回のみ）
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')" npx prisma db seed
```

### 代替方法: 直接指定

```bash
# DATABASE_URLを直接指定して実行
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx prisma db seed
```

## デプロイ後の確認

### 1. アプリケーションの起動確認

デプロイが完了したら、以下を確認してください：

- Vercelダッシュボードでビルドログを確認
- デプロイされたURLにアクセスして、正常に表示されるか確認

### 2. データベース接続の確認

- トップページが表示されるか確認
- Vercelのログで `PrismaClientInitializationError` などのエラーが出ていないか確認

### 3. 管理者ログインの確認

1. `/ja/login` にアクセス
2. 設定した管理者アカウントでログイン
3. `/ja/admin` にアクセスできるか確認

## トラブルシューティング

### エラー: `PrismaClientInitializationError`

**原因**: DATABASE_URLが設定されていない、または接続文字列が無効

**解決策**:
1. Vercel環境変数で `DATABASE_URL` が正しく設定されているか確認
2. Neonダッシュボードで接続文字列を再確認
3. 接続文字列の形式: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### エラー: マイグレーションが実行されていない

**原因**: データベーススキーマが初期化されていない

**解決策**:
```bash
# ローカルから本番データベースに対してマイグレーション実行
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx prisma db seed
```

### エラー: `@prisma/adapter-neon` 関連エラー

**原因**: Prisma Clientが正しく生成されていない、またはNeon以外のPostgreSQLを使用している

**解決策**:
1. **必ずNeon PostgreSQLを使用**してください（通常のPostgreSQLは非対応）
2. `package.json` の `postinstall` スクリプトで `prisma generate` が実行されることを確認
3. Vercelで再デプロイ

### エラー: ログインできない

**原因**: NextAuth設定または管理者アカウントが正しくない

**解決策**:
1. `NEXTAUTH_URL` が本番ドメインと一致しているか確認
2. `NEXTAUTH_SECRET` が設定されているか確認
3. `ADMIN_EMAIL`, `ADMIN_PASSWORD` が正しく設定されているか確認
4. シードデータが投入されているか確認

## デプロイ手順（概要）

### 1. Neon PostgreSQLのセットアップ

1. [Neon](https://neon.tech/) でアカウント作成
2. 新しいプロジェクトを作成
3. 接続文字列をコピー（後でVercelで使用）

### 2. GitHubリポジトリの準備

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/advent-calendar.git
git push -u origin main
```

### 3. Vercelでプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. "Add New" → "Project" をクリック
3. GitHubリポジトリを選択
4. 上記の「必須環境変数」セクションに従って環境変数を設定
5. "Deploy" をクリック

### 4. データベースマイグレーションを実行

デプロイ完了後、ローカルから以下を実行：

```bash
# Vercel環境変数を取得
vercel env pull .env.production

# マイグレーション実行
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')" npx prisma migrate deploy

# シードデータ投入
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')" npx prisma db seed
```

### 5. 動作確認

1. デプロイされたURLにアクセス
2. `/ja/login` で管理者ログイン
3. カレンダーと記事が正常に表示されることを確認

## 参考リンク

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
