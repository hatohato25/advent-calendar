import { defineConfig } from 'prisma/config';

/**
 * Prisma 7の新しいデータソース設定
 * 環境変数DATABASE_URLを使用してデータベース接続を設定
 *
 * Prisma 7では、datasource設定とseed設定はprisma.config.tsで管理
 * schema.prismaのdatasource db名と一致させる必要がある
 *
 * 環境による切り替え:
 * - 開発環境: SQLite (file:./dev.db)
 * - 本番環境 (Vercel): PostgreSQL (Neon)
 * Vercelでは環境変数DATABASE_URLにPostgreSQL接続文字列を設定すること
 */
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
