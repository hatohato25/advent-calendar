-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "allowedDates" TEXT,
    "firstLoginToken" TEXT,
    "firstLoginTokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "passwordHash", "role", "updatedAt", "username") SELECT "createdAt", "email", "id", "passwordHash", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_firstLoginToken_key" ON "users"("firstLoginToken");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_firstLoginToken_idx" ON "users"("firstLoginToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
