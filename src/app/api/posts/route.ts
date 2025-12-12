import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/error-handler";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addEmojiToPostTitle } from "@/lib/utils/emoji";

/**
 * 記事一覧取得API
 * クエリパラメータ:
 * - status: 'draft' | 'published' | 'all' (デフォルト: 'published')
 * - tag: タグ名でフィルタリング
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "published";
  const tag = searchParams.get("tag");

  // 下書きを取得する場合は認証が必要
  if (status === "draft" || status === "all") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
  }

  // クエリ条件を構築
  interface WhereClause {
    status?: string;
    tags?: {
      some: {
        slug: string;
      };
    };
  }

  const where: WhereClause = {};

  if (status !== "all") {
    where.status = status;
  }

  if (tag) {
    where.tags = {
      some: {
        slug: tag,
      },
    };
  }

  try {
    const articles = await prisma.article.findMany({
      where,
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        calendar: {
          select: {
            id: true,
            name: true,
            slug: true,
            year: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    return handleApiError(error, "GET /api/posts", "記事の取得に失敗しました");
  }
}

/**
 * 記事作成API
 * 認証必須
 */
export async function POST(request: NextRequest) {
  // 認証チェック
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // バリデーションスキーマ
    const articleSchema = z.object({
      title: z
        .string()
        .min(1, "タイトルは必須です")
        .max(200, "タイトルは200文字以内で入力してください"),
      content: z.string().min(1, "コンテンツは必須です"),
      date: z.number().int().min(1).max(25, "日付は1-25の範囲で指定してください"),
      tags: z.array(z.string()).max(10, "タグは10個まで設定できます").optional().default([]),
      status: z.enum(["draft", "published"]),
      calendarId: z.string().optional(), // カレンダーID（省略時はデフォルトカレンダー）
      calendarSlug: z.string().optional(), // カレンダースラッグ（IDの代わりに使用可能）
    });

    const validatedData = articleSchema.parse(body);

    // calendarIdを取得（スラッグ→ID解決、または直接ID指定、なければデフォルトカレンダー）
    let calendarId = validatedData.calendarId;

    // スラッグが指定されている場合はIDに解決
    if (validatedData.calendarSlug) {
      const calendar = await prisma.calendar.findUnique({
        where: { slug: validatedData.calendarSlug },
        select: { id: true },
      });

      if (!calendar) {
        return NextResponse.json(
          { error: "指定されたカレンダーが見つかりません" },
          { status: 404 },
        );
      }

      calendarId = calendar.id;
    } else if (!calendarId) {
      // IDもスラッグも指定されていない場合はデフォルトカレンダー
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

    // 権限チェック: editorはカレンダー内の許可された日程のみ作成可能
    // WHY: calendarIdがこの時点で確定しているため、カレンダーごとの権限を正しくチェックできる
    const { canEditArticleInCalendar } = await import("@/lib/auth");
    const canEdit = await canEditArticleInCalendar(session.user.id, calendarId, validatedData.date);
    if (!canEdit) {
      return NextResponse.json(
        { error: "この日程の記事を作成する権限がありません" },
        { status: 403 },
      );
    }

    // 同じカレンダー内の日付の重複チェック
    const existingArticle = await prisma.article.findUnique({
      where: {
        calendarId_date: {
          calendarId,
          date: validatedData.date,
        },
      },
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: "このカレンダーのこの日付には既に記事が存在します" },
        { status: 409 },
      );
    }

    // タグの処理（存在しないタグは作成）
    const tagRecords = await Promise.all(
      validatedData.tags.map(async (tagName: (typeof validatedData.tags)[0]) => {
        const slug = tagName.toLowerCase().replace(/\s+/g, "-");
        return await prisma.tag.upsert({
          where: { slug },
          update: {},
          create: {
            name: tagName,
            slug,
          },
        });
      }),
    );

    // タイトルに食物絵文字を追加
    // WHY: 記事の視覚的な識別性を向上させ、カレンダーグリッドで表示するため
    const titleWithEmoji = addEmojiToPostTitle(validatedData.title);

    // 記事作成
    const article = await prisma.article.create({
      data: {
        title: titleWithEmoji,
        content: validatedData.content,
        date: validatedData.date,
        status: validatedData.status,
        calendarId,
        authorId: session.user.id,
        publishedAt: validatedData.status === "published" ? new Date() : null,
        tags: {
          connect: tagRecords.map((tag: (typeof tagRecords)[0]) => ({ id: tag.id })),
        },
      },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // 公開された場合はISR再検証をトリガー
    if (validatedData.status === "published") {
      revalidatePath("/");
      revalidatePath(`/posts/${article.date}`);
    }

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: error.issues.map((issue: (typeof error.issues)[0]) => issue.message),
        },
        { status: 400 },
      );
    }

    return handleApiError(error, "POST /api/posts", "記事の作成に失敗しました");
  }
}
