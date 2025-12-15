-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "allowedDates" TEXT,
    "firstLoginToken" TEXT,
    "firstLoginTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "calendarId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_calendar_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "allowedDates" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_calendar_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArticleToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArticleToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_firstLoginToken_key" ON "users"("firstLoginToken");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_firstLoginToken_idx" ON "users"("firstLoginToken");

-- CreateIndex
CREATE UNIQUE INDEX "calendars_slug_key" ON "calendars"("slug");

-- CreateIndex
CREATE INDEX "calendars_slug_idx" ON "calendars"("slug");

-- CreateIndex
CREATE INDEX "calendars_year_idx" ON "calendars"("year");

-- CreateIndex
CREATE INDEX "calendars_isPublished_idx" ON "calendars"("isPublished");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_date_idx" ON "articles"("date");

-- CreateIndex
CREATE INDEX "articles_calendarId_idx" ON "articles"("calendarId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_calendarId_date_key" ON "articles"("calendarId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "user_calendar_permissions_userId_idx" ON "user_calendar_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_calendar_permissions_calendarId_idx" ON "user_calendar_permissions"("calendarId");

-- CreateIndex
CREATE UNIQUE INDEX "user_calendar_permissions_userId_calendarId_key" ON "user_calendar_permissions"("userId", "calendarId");

-- CreateIndex
CREATE INDEX "_ArticleToTag_B_index" ON "_ArticleToTag"("B");

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_calendar_permissions" ADD CONSTRAINT "user_calendar_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_calendar_permissions" ADD CONSTRAINT "user_calendar_permissions_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
