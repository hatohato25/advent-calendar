import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// プロフィール更新のバリデーションスキーマ
const profileUpdateSchema = z.object({
  displayName: z.string().max(50, "表示名は50文字以内である必要があります").optional(),
});

/**
 * PUT /api/users/me/profile
 * 現在のユーザーのプロフィール情報を更新
 * 認証必須（admin, editor）
 *
 * WHY: 自分自身のプロフィールのみ変更可能（セキュリティ）
 */
export async function PUT(request: Request) {
  try {
    // 1. セッション認証チェック
    const session = await requireAuth();

    // 2. リクエストボディのバリデーション
    const body = await request.json();
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    let { displayName } = validation.data;

    // 3. displayNameが空文字の場合はNULLに変換
    // WHY: 空文字の場合、usernameをフォールバックとして使用するため
    if (displayName === "") {
      displayName = undefined;
    }

    // 4. データベースのUser.displayNameを更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: displayName === undefined ? null : displayName,
      },
      select: {
        displayName: true,
      },
    });

    // 5. レスポンス返却
    return NextResponse.json(
      {
        message: "プロフィールを更新しました",
        displayName: updatedUser.displayName,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, "PUT /api/users/me/profile", "プロフィールの更新に失敗しました");
  }
}
