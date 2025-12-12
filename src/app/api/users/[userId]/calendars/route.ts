import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * カレンダー権限作成のバリデーションスキーマ
 */
const createPermissionSchema = z.object({
  calendarId: z.string().min(1, "カレンダーIDは必須です"),
  allowedDates: z
    .array(
      z
        .number()
        .int()
        .min(1, "日程は1以上の整数である必要があります")
        .max(25, "日程は25以下の整数である必要があります"),
    )
    .min(1, "最低1つの日程を選択してください")
    .refine(
      (dates) => {
        const uniqueDates = new Set(dates);
        return uniqueDates.size === dates.length;
      },
      { message: "重複した日程が含まれています" },
    ),
});

/**
 * GET /api/users/:userId/calendars
 * ユーザーのカレンダー権限一覧を取得
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const { userId } = await params;

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // カレンダー権限一覧を取得
    const permissions = await prisma.userCalendarPermission.findMany({
      where: { userId },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            year: true,
            slug: true,
          },
        },
      },
      orderBy: [{ calendar: { year: "desc" } }, { calendar: { name: "asc" } }],
    });

    // allowedDatesをJSONパース
    const permissionsWithParsedDates = permissions.map((permission) => ({
      ...permission,
      allowedDates: JSON.parse(permission.allowedDates) as number[],
    }));

    return NextResponse.json({
      permissions: permissionsWithParsedDates,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    return handleApiError(
      error,
      "GET /api/users/:userId/calendars",
      "カレンダー権限の取得に失敗しました",
    );
  }
}

/**
 * POST /api/users/:userId/calendars
 * ユーザーにカレンダー権限を追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const { userId } = await params;
    const body = await request.json();

    // バリデーション
    const validationResult = createPermissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: validationResult.error.issues.map((e) => e.message),
        },
        { status: 400 },
      );
    }

    const { calendarId, allowedDates } = validationResult.data;

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // カレンダーの存在確認
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    });

    if (!calendar) {
      return NextResponse.json({ error: "カレンダーが見つかりません" }, { status: 404 });
    }

    // 既存権限の重複チェック
    const existingPermission = await prisma.userCalendarPermission.findUnique({
      where: {
        userId_calendarId: {
          userId,
          calendarId,
        },
      },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "このカレンダーには既に権限が設定されています" },
        { status: 409 },
      );
    }

    // 日程をソート
    const sortedDates = [...allowedDates].sort((a, b) => a - b);

    // 権限作成
    const permission = await prisma.userCalendarPermission.create({
      data: {
        userId,
        calendarId,
        allowedDates: JSON.stringify(sortedDates),
      },
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            year: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        permission: {
          ...permission,
          allowedDates: sortedDates,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    return handleApiError(
      error,
      "POST /api/users/:userId/calendars",
      "カレンダー権限の作成に失敗しました",
    );
  }
}
