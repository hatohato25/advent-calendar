import matter from "gray-matter";
import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// インポートリクエストのスキーマ
const ImportSchema = z.object({
  markdown: z.string().min(1, "Markdownコンテンツが必要です"),
  overwrite: z.boolean().default(false), // 既存記事を上書きするかどうか
  calendarId: z.string().optional(), // カレンダーID（省略時はデフォルトカレンダー）
});

/**
 * Markdownファイルから記事をインポート
 * POST /api/posts/import
 */
export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await requireAuth();

    const body = await request.json();
    const validation = ImportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { markdown, overwrite, calendarId: requestCalendarId } = validation.data;

    // カレンダーIDを取得（指定されていない場合は最新カレンダー）
    let calendarId = requestCalendarId;
    if (!calendarId) {
      const defaultCalendar = await prisma.calendar.findFirst({
        orderBy: { year: "desc" },
        select: { id: true },
      });

      if (!defaultCalendar) {
        return NextResponse.json(
          { error: "カレンダーが存在しません。先にカレンダーを作成してください。" },
          { status: 400 },
        );
      }

      calendarId = defaultCalendar.id;
    }

    // フロントマターをパース
    const { data: frontmatter, content } = matter(markdown);

    // 必須フィールドの検証
    if (!frontmatter.title || typeof frontmatter.title !== "string") {
      return NextResponse.json({ error: "フロントマターにtitleが必要です" }, { status: 400 });
    }

    if (!frontmatter.date || typeof frontmatter.date !== "number") {
      return NextResponse.json(
        { error: "フロントマターにdate（数値）が必要です" },
        { status: 400 },
      );
    }

    const date = frontmatter.date;
    if (date < 1 || date > 25) {
      return NextResponse.json({ error: "dateは1〜25の範囲である必要があります" }, { status: 400 });
    }

    const status = frontmatter.status === "published" ? "published" : "draft";
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

    // 同じカレンダー内の同じ日付の記事が既に存在するかチェック
    const existingArticle = await prisma.article.findFirst({
      where: {
        calendarId,
        date,
      },
    });

    if (existingArticle && !overwrite) {
      return NextResponse.json(
        {
          error: "同じ日付の記事が既に存在します",
          existingArticleId: existingArticle.id,
        },
        { status: 409 },
      );
    }

    // タグの処理（存在しないタグは作成）
    const tagConnections = await Promise.all(
      tags.map(async (tagName: string) => {
        if (typeof tagName !== "string") return null;

        const slug = tagName.toLowerCase().replace(/\s+/g, "-");
        const tag = await prisma.tag.upsert({
          where: { slug },
          create: { name: tagName, slug },
          update: {},
        });
        return { id: tag.id };
      }),
    );

    const validTagConnections = tagConnections.filter((tag): tag is { id: string } => tag !== null);

    // 記事の作成または更新
    if (existingArticle && overwrite) {
      // 既存記事を更新
      const updatedArticle = await prisma.article.update({
        where: { id: existingArticle.id },
        data: {
          title: frontmatter.title,
          content,
          status,
          publishedAt: status === "published" ? new Date() : null,
          tags: {
            set: validTagConnections,
          },
        },
        include: {
          tags: true,
        },
      });

      return NextResponse.json(
        {
          article: updatedArticle,
          message: "記事を更新しました",
        },
        { status: 200 },
      );
    }

    // 新規作成
    const newArticle = await prisma.article.create({
      data: {
        title: frontmatter.title,
        content,
        date,
        status,
        calendarId,
        publishedAt: status === "published" ? new Date() : null,
        authorId: session.user.id,
        tags: {
          connect: validTagConnections,
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(
      {
        article: newArticle,
        message: "記事をインポートしました",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    return handleApiError(error, "POST /api/posts/import", "記事のインポートに失敗しました");
  }
}
