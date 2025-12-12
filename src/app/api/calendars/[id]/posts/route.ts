import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { canAccessCalendar, canEditArticleInCalendar, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/calendars/:id/posts
 * カレンダーの記事一覧を取得
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: calendarId } = await context.params;
    const { searchParams } = new URL(request.url);
    const session = await getSession();

    // カレンダーの存在確認
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!calendar) {
      return NextResponse.json({ error: "カレンダーが見つかりません" }, { status: 404 });
    }

    // 権限チェック：非公開カレンダーは管理者または担当編集者のみアクセス可能
    if (!calendar.isPublished && session) {
      if (session.user.role === "editor") {
        const hasAccess = await canAccessCalendar(session.user.id, calendarId);
        if (!hasAccess) {
          return NextResponse.json(
            { error: "このカレンダーにアクセスする権限がありません" },
            { status: 403 },
          );
        }
      }
    }

    // クエリパラメータ
    const status = searchParams.get("status"); // 'draft' | 'published' | 'all'
    const tag = searchParams.get("tag");

    // WHERE条件の構築
    interface WhereClause {
      calendarId: string;
      status?: string;
      tags?: {
        some: {
          slug: string;
        };
      };
    }

    const where: WhereClause = {
      calendarId,
    };

    // 未認証または閲覧者は公開記事のみ表示
    if (
      !session ||
      (session &&
        session.user.role === "editor" &&
        !(await canAccessCalendar(session.user.id, calendarId)))
    ) {
      where.status = "published";
    } else {
      // 管理者または担当編集者はstatusパラメータに従う
      if (status && status !== "all") {
        where.status = status;
      }
    }

    // タグでフィルタリング
    if (tag) {
      where.tags = {
        some: {
          slug: tag,
        },
      };
    }

    // 記事一覧を取得
    const articles = await prisma.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const response = articles.map((article: (typeof articles)[0]) => ({
      id: article.id,
      title: article.title,
      date: article.date,
      status: article.status,
      tags: article.tags,
      author: article.author,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    }));

    return NextResponse.json({ articles: response });
  } catch (error) {
    return handleApiError(error, "GET /api/calendars/:id/posts", "記事一覧の取得に失敗しました");
  }
}

/**
 * POST /api/calendars/:id/posts
 * カレンダーに記事を作成
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: calendarId } = await context.params;
    const session = await getSession();

    // 認証チェック
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // カレンダーの存在確認
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!calendar) {
      return NextResponse.json({ error: "カレンダーが見つかりません" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, date, tags, status } = body;

    // バリデーション（簡易版）
    if (!title || !content || date === undefined) {
      return NextResponse.json({ error: "タイトル、内容、日付は必須です" }, { status: 400 });
    }

    if (date < 1 || date > 25) {
      return NextResponse.json(
        { error: "日付は1から25の範囲である必要があります" },
        { status: 400 },
      );
    }

    // 権限チェック：カレンダーへのアクセス権限
    const hasAccess = await canAccessCalendar(session.user.id, calendarId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "このカレンダーに記事を作成する権限がありません" },
        { status: 403 },
      );
    }

    // 権限チェック：日付の権限（編集者のみ）
    if (session.user.role === "editor") {
      const canEdit = await canEditArticleInCalendar(session.user.id, calendarId, date);
      if (!canEdit) {
        return NextResponse.json(
          { error: "この日付に記事を作成する権限がありません" },
          { status: 403 },
        );
      }
    }

    // 日付の重複チェック
    const existingArticle = await prisma.article.findUnique({
      where: {
        calendarId_date: {
          calendarId,
          date,
        },
      },
    });

    if (existingArticle) {
      return NextResponse.json({ error: "この日付には既に記事が存在します" }, { status: 409 });
    }

    // タグの処理
    const tagConnections = tags
      ? await Promise.all(
          (tags as string[]).map(async (tagName: string) => {
            // タグが既に存在するか確認
            let tag = await prisma.tag.findUnique({
              where: { name: tagName },
            });

            // 存在しない場合は作成
            if (!tag) {
              const slug = tagName.toLowerCase().replace(/\s+/g, "-");
              tag = await prisma.tag.create({
                data: {
                  name: tagName,
                  slug,
                },
              });
            }

            return { id: tag.id };
          }),
        )
      : [];

    // 記事作成
    const article = await prisma.article.create({
      data: {
        title,
        content,
        date,
        status: status || "draft",
        calendarId,
        authorId: session.user.id,
        tags: {
          connect: tagConnections,
        },
        publishedAt: status === "published" ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        article: {
          id: article.id,
          title: article.title,
          content: article.content,
          date: article.date,
          status: article.status,
          calendarId: article.calendarId,
          tags: article.tags,
          author: article.author,
          createdAt: article.createdAt.toISOString(),
          updatedAt: article.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "POST /api/calendars/:id/posts", "記事の作成に失敗しました");
  }
}
