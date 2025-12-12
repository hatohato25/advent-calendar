import { defineConfig } from 'prisma/config';

/**
 * Prisma 7の新しいデータソース設定
 * 環境変数DATABASE_URLを使用してデータベース接続を設定
 *
 * Prisma 7では、datasource設定とseed設定はprisma.config.tsで管理
 * schema.prismaのdatasource db名と一致させる必要がある
 *
 * 開発環境: デフォルトでSQLiteを使用（file:./dev.db）
 * 本番環境: 環境変数DATABASE_URLを必ず設定すること
 */
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? (
      process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('DATABASE_URL is required in production'); })()
        : 'file:./dev.db'
    ),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
