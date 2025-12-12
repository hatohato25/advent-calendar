import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarUpdateSchema } from "@/lib/validation/calendar";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/calendars/:id
 * カレンダー詳細を取得
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSession();

    const calendar = await prisma.calendar.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!calendar) {
      return NextResponse.json({ error: "カレンダーが見つかりません" }, { status: 404 });
    }

    // 権限チェック：非公開カレンダーは管理者または担当編集者のみアクセス可能
    if (!calendar.isPublished) {
      if (!session) {
        return NextResponse.json(
          { error: "このカレンダーにアクセスする権限がありません" },
          { status: 403 },
        );
      }

      if (session.user.role === "editor") {
        const hasPermission = await prisma.userCalendarPermission.findUnique({
          where: {
            userId_calendarId: {
              userId: session.user.id,
              calendarId: id,
            },
          },
        });

        if (!hasPermission) {
          return NextResponse.json(
            { error: "このカレンダーにアクセスする権限がありません" },
            { status: 403 },
          );
        }
      }
    }

    return NextResponse.json({
      calendar: {
        id: calendar.id,
        name: calendar.name,
        year: calendar.year,
        slug: calendar.slug,
        description: calendar.description,
        isPublished: calendar.isPublished,
        theme: calendar.theme,
        articleCount: calendar._count.articles,
        createdBy: calendar.createdBy,
        createdAt: calendar.createdAt.toISOString(),
        updatedAt: calendar.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/calendars/:id", "カレンダーの取得に失敗しました");
  }
}

/**
 * PUT /api/calendars/:id
 * カレンダーを更新（管理者のみ）
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSession();

    // 管理者権限チェック
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    const body = await request.json();

    // バリデーション
    const validationResult = calendarUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: validationResult.error.issues.map((e: (typeof validationResult.error.issues)[0]) => e.message),
        },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    // カレンダーの存在確認
    const existingCalendar = await prisma.calendar.findUnique({
      where: { id },
    });

    if (!existingCalendar) {
      return NextResponse.json({ error: "カレンダーが見つかりません" }, { status: 404 });
    }

    // 更新データの準備（undefinedを除外）
    const updateData: {
      name?: string;
      description?: string | null;
      isPublished?: boolean;
      theme?: string | null;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.theme !== undefined) updateData.theme = data.theme || null;

    // カレンダー更新
    const calendar = await prisma.calendar.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      calendar: {
        id: calendar.id,
        name: calendar.name,
        year: calendar.year,
        slug: calendar.slug,
        description: calendar.description,
        isPublished: calendar.isPublished,
        theme: calendar.theme,
        createdBy: calendar.createdBy,
        createdAt: calendar.createdAt.toISOString(),
        updatedAt: calendar.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "PUT /api/calendars/:id", "カレンダーの更新に失敗しました");
  }
}

/**
 * DELETE /api/calendars/:id
 * カレンダーを削除（管理者のみ）
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSession();

    // 管理者権限チェック
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    // カレンダーの存在確認と記事数をカウント
    const calendar = await prisma.calendar.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!calendar) {
      return NextResponse.json({ error: "カレンダーが見つかりません" }, { status: 404 });
    }

    // 記事が存在する場合は警告メッセージを含める（削除は実行する）
    const articleCount = calendar._count.articles;

    // カレンダー削除（関連する記事もカスケード削除される）
    await prisma.calendar.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: "カレンダーを削除しました",
        deletedArticleCount: articleCount,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/calendars/:id", "カレンダーの削除に失敗しました");
  }
}
