import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { generateFirstLoginToken, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/users/[userId]/reset-token
 * パスワードリセット用トークンを発行（adminのみ）
 */
export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const { userId: id } = await params;

    // ユーザー存在チェック
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 新しい一時トークン生成
    const { token, expiresAt } = generateFirstLoginToken();

    // トークン更新
    await prisma.user.update({
      where: { id },
      data: {
        firstLoginToken: token,
        firstLoginTokenExpiresAt: expiresAt,
      },
    });

    // 初回ログイン用URL生成
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const firstLoginUrl = `${baseUrl}/auth/first-login?token=${token}`;

    return NextResponse.json({ firstLoginUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "認証が必要です") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return handleApiError(
      error,
      "POST /api/users/:userId/reset-token",
      "トークンの再発行に失敗しました",
    );
  }
}
