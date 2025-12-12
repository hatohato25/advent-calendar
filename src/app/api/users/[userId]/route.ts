import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validation/user";

/**
 * GET /api/users/[userId]
 * ユーザー詳細を取得（adminのみ）
 */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const { userId: id } = await params;

    // ユーザー取得（passwordHashとfirstLoginTokenを除外）
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        allowedDates: true,
        firstLoginTokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "認証が必要です") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return handleApiError(error, "GET /api/users/:userId", "ユーザーの取得に失敗しました");
  }
}

/**
 * PUT /api/users/[userId]
 * ユーザー情報を更新（adminのみ）
 */
export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const { userId: id } = await params;

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validation = userUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: validation.error.issues.map((err) => err.message),
        },
        { status: 400 },
      );
    }

    // ユーザー存在チェック
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const { username, email, role, allowedDates } = validation.data;

    // ユーザー名・メールアドレスの重複チェック（自分自身は除外）
    if (username || email) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [username ? { username } : {}, email ? { email } : {}].filter(
                (condition) => Object.keys(condition).length > 0,
              ),
            },
          ],
        },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: "ユーザー名またはメールアドレスが既に使用されています" },
          { status: 409 },
        );
      }
    }

    // ユーザー更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(role && { role }),
        ...(allowedDates !== undefined && {
          allowedDates: allowedDates ? JSON.stringify(allowedDates) : null,
        }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        allowedDates: true,
        firstLoginTokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "認証が必要です") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return handleApiError(error, "PUT /api/users/:userId", "ユーザーの更新に失敗しました");
  }
}

/**
 * DELETE /api/users/[userId]
 * ユーザーを削除（adminのみ）
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // 管理者権限チェック
    const session = await requireAdmin();

    const { userId: id } = await params;

    // 自分自身の削除は禁止
    if (session.user.id === id) {
      return NextResponse.json({ error: "自分自身を削除することはできません" }, { status: 400 });
    }

    // ユーザー存在チェック
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // ユーザー削除（カスケード削除: 記事も一緒に削除）
    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "認証が必要です") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return handleApiError(error, "DELETE /api/users/:userId", "ユーザーの削除に失敗しました");
  }
}
