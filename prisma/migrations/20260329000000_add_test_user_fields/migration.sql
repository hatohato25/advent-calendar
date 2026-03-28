-- AlterTable: テストユーザー機能のためのフィールドを追加
-- isTestUser: テストモードで作成されたユーザーかどうかを識別するフラグ
-- testUserExpiresAt: テストユーザーの有効期限（作成から6時間後）
ALTER TABLE "users" ADD COLUMN "isTestUser" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "testUserExpiresAt" TIMESTAMP(3);

-- CreateIndex: テストユーザー検索クエリを最適化するため
CREATE INDEX "users_isTestUser_idx" ON "users"("isTestUser");
CREATE INDEX "users_testUserExpiresAt_idx" ON "users"("testUserExpiresAt");
