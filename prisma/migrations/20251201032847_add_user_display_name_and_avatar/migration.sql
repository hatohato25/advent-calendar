-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "users" ADD COLUMN "displayName" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "calendarId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "articles_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_articles" ("authorId", "calendarId", "content", "createdAt", "date", "id", "publishedAt", "status", "title", "updatedAt") SELECT "authorId", "calendarId", "content", "createdAt", "date", "id", "publishedAt", "status", "title", "updatedAt" FROM "articles";
DROP TABLE "articles";
ALTER TABLE "new_articles" RENAME TO "articles";
CREATE INDEX "articles_status_idx" ON "articles"("status");
CREATE INDEX "articles_date_idx" ON "articles"("date");
CREATE INDEX "articles_calendarId_idx" ON "articles"("calendarId");
CREATE UNIQUE INDEX "articles_calendarId_date_key" ON "articles"("calendarId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
