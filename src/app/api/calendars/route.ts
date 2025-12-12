import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarCreateSchema, calendarQuerySchema } from "@/lib/validation/calendar";

/**
 * GET /api/calendars
 * カレンダー一覧を取得
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSession();

    // クエリパラメータのバリデーション
    const queryResult = calendarQuerySchema.safeParse({
      year: searchParams.get("year"),
      isPublished: searchParams.get("isPublished"),
      theme: searchParams.get("theme"),
      sort: searchParams.get("sort"),
      order: searchParams.get("order"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "無効なクエリパラメータです", details: queryResult.error.issues },
        { status: 400 },
      );
    }

    const { year, isPublished, theme, sort, order } = queryResult.data;

    // 権限に応じたフィルタリング
    const where: Prisma.CalendarWhereInput = {};

    // 未認証ユーザーは公開カレンダーのみ表示
    if (!session) {
      where.isPublished = true;
    }

    // 編集者は担当カレンダーのみ表示（管理者は全て表示）
    if (session?.user.role === "editor") {
      where.permissions = {
        some: {
          userId: session.user.id,
        },
      };
    }

    // フィルタリング
    if (year !== undefined) {
      where.year = year;
    }
    if (isPublished !== undefined && session?.user.role === "admin") {
      where.isPublished = isPublished;
    }
    if (theme) {
      where.theme = {
        contains: theme,
      };
    }

    // カレンダー一覧を取得
    const calendars = await prisma.calendar.findMany({
      where,
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
      orderBy: {
        [sort]: order,
      },
    });

    // レスポンス整形
    const response = calendars.map((calendar: (typeof calendars)[0]) => ({
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
    }));

    return NextResponse.json({ calendars: response });
  } catch (error) {
    return handleApiError(error, "GET /api/calendars", "カレンダー一覧の取得に失敗しました");
  }
}

/**
 * POST /api/calendars
 * カレンダーを作成（管理者のみ）
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();

    // 管理者権限チェック
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    const body = await request.json();

    // バリデーション
    const validationResult = calendarCreateSchema.safeParse(body);

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

    // スラッグの重複チェック
    const existingCalendar = await prisma.calendar.findUnique({
      where: { slug: data.slug },
    });

    if (existingCalendar) {
      return NextResponse.json({ error: "このスラッグは既に使用されています" }, { status: 409 });
    }

    // カレンダー作成
    const calendar = await prisma.calendar.create({
      data: {
        name: data.name,
        year: data.year,
        slug: data.slug,
        description: data.description || null,
        isPublished: data.isPublished ?? false,
        theme: data.theme || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "POST /api/calendars", "カレンダーの作成に失敗しました");
  }
}
