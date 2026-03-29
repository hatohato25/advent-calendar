-- AlterTable: calendars.createdById の外部キー制約を RESTRICT から CASCADE に変更
-- WHY: テストユーザー削除時に紐づく Calendar が残っていてもエラーにならないよう、
--      ユーザー削除時にカレンダーも連鎖削除されるようにする

-- 既存の RESTRICT 制約を削除してから CASCADE 付きで再作成する
-- WHY: PostgreSQL は外部キー制約を ALTER で直接変更できないため、削除→再作成が必要

ALTER TABLE "calendars" DROP CONSTRAINT "calendars_createdById_fkey";

ALTER TABLE "calendars" ADD CONSTRAINT "calendars_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
