import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// グローバルスコープに型を追加（開発環境でのホットリロード対応）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7.1: adapter を使用した直接データベース接続
// データベースURLに応じて適切なadapterを選択
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not defined. " +
        "Please set the DATABASE_URL environment variable in your .env file. " +
        'Example: DATABASE_URL="file:./dev.db"',
    );
  }

  // PostgreSQL (Neon) の場合: PrismaNeonアダプターを使用
  // Prisma 7.1.0では、Neon Serverless Driver経由での接続が推奨される
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    const poolConfig = { connectionString: databaseUrl };
    const adapter = new PrismaNeon(poolConfig);
    return new PrismaClient({ adapter });
  }

  // SQLite/libSQLの場合: PrismaLibSqlアダプターにConfig型のオブジェクトを渡す
  // Prisma 7.1.0では、PrismaLibSqlはConfig型（{ url: string }）を受け取る
  if (databaseUrl.startsWith("file:") || databaseUrl.startsWith("libsql://")) {
    const adapter = new PrismaLibSql({
      url: databaseUrl,
    });
    return new PrismaClient({ adapter });
  }

  // その他の場合はエラー
  throw new Error(`Unsupported database URL: ${databaseUrl}`);
}

// Prismaクライアントのシングルトンインスタンス
// 開発環境では複数回インスタンス化されるのを防ぐため、globalに保存
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 開発環境でのみglobalに保存（ホットリロード対応）
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
