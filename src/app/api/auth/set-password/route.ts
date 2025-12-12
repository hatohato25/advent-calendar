import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { hashPassword, verifyFirstLoginToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setPasswordSchema } from "@/lib/validation/password";

/**
 * POST /api/auth/set-password
 * 初回パスワードを設定
 */
export async function POST(request: Request) {
  try {
    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validation = setPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: validation.error.issues.map((err) => err.message),
        },
        { status: 400 },
      );
    }

    const { token, password } = validation.data;

    // トークン検証
    const tokenResult = await verifyFirstLoginToken(token);

    if (!tokenResult.valid) {
      return NextResponse.json({ error: tokenResult.error }, { status: 400 });
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password);

    // パスワード設定とトークン無効化
    await prisma.user.update({
      where: { id: tokenResult.userId },
      data: {
        passwordHash,
        firstLoginToken: null,
        firstLoginTokenExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "パスワードが設定されました",
    });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/set-password", "パスワードの設定に失敗しました");
  }
}
