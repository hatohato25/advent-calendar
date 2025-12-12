import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/me
 * 現在のユーザー情報を取得
 * 認証必須（admin, editor）
 */
export async function GET() {
  try {
    // 1. セッション認証チェック
    const session = await requireAuth();

    // 2. データベースからユーザー情報を取得（passwordHashを除外）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 3. JSON形式でレスポンス返却
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return handleApiError(error, "GET /api/users/me", "ユーザー情報の取得に失敗しました");
  }
}
