import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * カレンダー権限更新のバリデーションスキーマ
 */
const updatePermissionSchema = z.object({
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
 * PUT /api/users/:userId/calendars/:permissionId
 * ユーザーのカレンダー権限を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; permissionId: string }> },
) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const { userId, permissionId } = await params;
    const body = await request.json();

    // バリデーション
    const validationResult = updatePermissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: validationResult.error.issues.map((e) => e.message),
        },
        { status: 400 },
      );
    }

    const { allowedDates } = validationResult.data;

    // 権限の存在確認
    const existingPermission = await prisma.userCalendarPermission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: "権限が見つかりません" }, { status: 404 });
    }

    // userIdが一致するか確認
    if (existingPermission.userId !== userId) {
      return NextResponse.json({ error: "権限が見つかりません" }, { status: 404 });
    }

    // 日程をソート
    const sortedDates = [...allowedDates].sort((a, b) => a - b);

    // 権限更新
    const permission = await prisma.userCalendarPermission.update({
      where: { id: permissionId },
      data: {
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

    return NextResponse.json({
      permission: {
        ...permission,
        allowedDates: sortedDates,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    return handleApiError(
      error,
      "PUT /api/users/:userId/calendars/:permissionId",
      "カレンダー権限の更新に失敗しました",
    );
  }
}

/**
 * DELETE /api/users/:userId/calendars/:permissionId
 * ユーザーのカレンダー権限を削除
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string; permissionId: string }> },
) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const { userId, permissionId } = await params;

    // 権限の存在確認
    const existingPermission = await prisma.userCalendarPermission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: "権限が見つかりません" }, { status: 404 });
    }

    // userIdが一致するか確認
    if (existingPermission.userId !== userId) {
      return NextResponse.json({ error: "権限が見つかりません" }, { status: 404 });
    }

    // 権限削除
    await prisma.userCalendarPermission.delete({
      where: { id: permissionId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    return handleApiError(
      error,
      "DELETE /api/users/:userId/calendars/:permissionId",
      "カレンダー権限の削除に失敗しました",
    );
  }
}
