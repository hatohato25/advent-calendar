# デプロイメントガイド

## データベースのセットアップ

### 開発環境（SQLite）

開発環境では SQLite を使用します。

```bash
# マイグレーション実行
npx prisma migrate dev

# シードデータ投入
npx prisma db seed
```

### 本番環境（PostgreSQL）

本番環境では PostgreSQL を使用します。Vercel Postgres または Supabase を推奨します。

#### 1. データベースプロバイダーの選択

**Vercel Postgres (推奨)**
- Vercel ダッシュボードから Postgres データベースを作成
- 接続文字列を取得

**Supabase**
- [Supabase](https://supabase.com/) でプロジェクト作成
- Settings → Database → Connection string を取得

#### 2. スキーマの変更

`prisma/schema.prisma` の provider を変更：

```prisma
datasource db {
  provider = "postgresql" // sqlite から変更
  url      = env("DATABASE_URL")
}
```

#### 3. 環境変数の設定

Vercel ダッシュボードで以下の環境変数を設定：

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<強力なランダム文字列>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<強力なパスワード>
ADMIN_EMAIL=admin@example.com
```

#### 4. マイグレーション実行

デプロイ後、Vercel のコンソールまたはローカルで実行：

```bash
# Vercel CLI でマイグレーション
vercel env pull .env.production
npx prisma migrate deploy

# シードデータ投入（初回のみ）
npx prisma db seed
```

## セキュリティ設定

### 1. NEXTAUTH_SECRET の生成

強力なランダム文字列を生成：

```bash
openssl rand -base64 32
```

### 2. セキュリティヘッダーの設定

`next.config.ts` にセキュリティヘッダーを追加（オプション）：

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### 3. CORS設定

API Routes は同一オリジンのみ許可（デフォルト設定で OK）

## デプロイ手順

### Vercel へのデプロイ

1. **GitHub リポジトリと連携**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/advent-calendar.git
   git push -u origin main
   ```

2. **Vercel でプロジェクトをインポート**
   - [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
   - "Add New" → "Project" をクリック
   - GitHub リポジトリを選択

3. **環境変数を設定**
   - Environment Variables セクションで `.env.production.example` の内容を参考に設定

4. **デプロイ**
   - "Deploy" ボタンをクリック
   - ビルドとデプロイが自動実行される

5. **データベースセットアップ**
   ```bash
   # Vercel CLI をインストール
   npm i -g vercel

   # 本番環境にログイン
   vercel login

   # 環境変数をダウンロード
   vercel env pull .env.production

   # マイグレーション実行
   DATABASE_URL="<本番環境のDATABASE_URL>" npx prisma migrate deploy

   # シードデータ投入
   DATABASE_URL="<本番環境のDATABASE_URL>" npx prisma db seed
   ```

## トラブルシューティング

### マイグレーションエラー

**問題**: `Error: P1001: Can't reach database server`

**解決策**:
- DATABASE_URL が正しいか確認
- データベースサーバーが起動しているか確認
- ファイアウォール設定を確認（Vercel IP を許可）

### ビルドエラー

**問題**: `Type error: ...`

**解決策**:
```bash
# ローカルで型チェック
npm run build

# Prisma Client を再生成
npx prisma generate
```

### 認証エラー

**問題**: ログインできない

**解決策**:
- NEXTAUTH_URL が本番ドメインと一致しているか確認
- NEXTAUTH_SECRET が設定されているか確認
- シードデータが投入されているか確認

## パフォーマンス確認

デプロイ後、以下を確認：

```bash
# Lighthouse 監査
npx lighthouse https://your-domain.vercel.app --view

# Core Web Vitals 確認
# Vercel Analytics で確認可能
```

## バックアップ

### データベースバックアップ

**Vercel Postgres**:
- 自動バックアップが有効（Pro プラン以上）

**手動バックアップ**:
```bash
# PostgreSQL のダンプ取得
pg_dump $DATABASE_URL > backup.sql

# リストア
psql $DATABASE_URL < backup.sql
```

### 記事データのエクスポート

管理画面から Markdown ファイルとしてエクスポート可能：
- 各記事の編集ページで「エクスポート」ボタン
- または `/admin` から「すべてエクスポート」

## モニタリング

### Vercel Analytics

- Vercel ダッシュボードで自動的に有効化
- Core Web Vitals、訪問者数などを確認可能

### エラートラッキング（オプション）

Sentry 連携を検討：
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```
