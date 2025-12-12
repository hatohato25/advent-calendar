-- Step 1: Create Calendar table
CREATE TABLE "calendars" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calendars_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Calendar indexes
CREATE UNIQUE INDEX "calendars_slug_key" ON "calendars"("slug");
CREATE INDEX "calendars_slug_idx" ON "calendars"("slug");
CREATE INDEX "calendars_year_idx" ON "calendars"("year");
CREATE INDEX "calendars_isPublished_idx" ON "calendars"("isPublished");

-- Step 2: Create default calendar
-- Insert default calendar using first admin user
INSERT INTO "calendars" ("id", "name", "year", "slug", "description", "isPublished", "createdById", "createdAt", "updatedAt")
SELECT
    'default-calendar-2025',
    'アドベントカレンダー 2025',
    2025,
    'advent-2025',
    'デフォルトのアドベントカレンダー',
    true,
    (SELECT "id" FROM "users" WHERE "role" = 'admin' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "users" WHERE "role" = 'admin');

-- Step 3: Create UserCalendarPermission table
CREATE TABLE "user_calendar_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "allowedDates" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_calendar_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_calendar_permissions_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create UserCalendarPermission indexes
CREATE INDEX "user_calendar_permissions_userId_idx" ON "user_calendar_permissions"("userId");
CREATE INDEX "user_calendar_permissions_calendarId_idx" ON "user_calendar_permissions"("calendarId");
CREATE UNIQUE INDEX "user_calendar_permissions_userId_calendarId_key" ON "user_calendar_permissions"("userId", "calendarId");

-- Step 4: Migrate user permissions to UserCalendarPermission
INSERT INTO "user_calendar_permissions" ("id", "userId", "calendarId", "allowedDates", "createdAt", "updatedAt")
SELECT
    'perm-' || "id",
    "id",
    'default-calendar-2025',
    "allowedDates",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE "role" = 'editor' AND "allowedDates" IS NOT NULL;

-- Step 5: Add calendarId to articles table (with default value temporarily)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "calendarId" TEXT NOT NULL DEFAULT 'default-calendar-2025',
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "articles_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy existing articles to new table with default calendarId
INSERT INTO "new_articles" ("id", "title", "content", "date", "status", "calendarId", "authorId", "createdAt", "updatedAt", "publishedAt")
SELECT "id", "title", "content", "date", "status", 'default-calendar-2025', "authorId", "createdAt", "updatedAt", "publishedAt"
FROM "articles";

-- Drop old table and rename new table
DROP TABLE "articles";
ALTER TABLE "new_articles" RENAME TO "articles";

-- Create indexes
CREATE INDEX "articles_status_idx" ON "articles"("status");
CREATE INDEX "articles_date_idx" ON "articles"("date");
CREATE INDEX "articles_calendarId_idx" ON "articles"("calendarId");
CREATE UNIQUE INDEX "articles_calendarId_date_key" ON "articles"("calendarId", "date");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
