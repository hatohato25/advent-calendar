import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { hashPassword, requireAuth, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validation/password";

/**
 * PUT /api/users/me/password
 * 現在のユーザーのパスワードを変更
 * 認証必須（admin, editor）
 *
 * WHY: パスワード変更時は現在のパスワード確認必須（セキュリティ強化）
 */
export async function PUT(request: Request) {
  try {
    // 1. セッション認証チェック
    const session = await requireAuth();

    // 2. リクエストボディのバリデーション
    const body = await request.json();
    const validation = passwordChangeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // 3. データベースから現在のパスワードハッシュを取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "ユーザーが見つからないか、パスワードが設定されていません" },
        { status: 404 },
      );
    }

    // 4. 現在のパスワードを検証
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 401 });
    }

    // 5. 新しいパスワードをハッシュ化
    const newPasswordHash = await hashPassword(newPassword);

    // 6. データベースを更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    // 7. 成功レスポンス返却
    // WHY: セッションは維持（再ログイン不要）
    return NextResponse.json({ message: "パスワードを変更しました" }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "PUT /api/users/me/password", "パスワードの変更に失敗しました");
  }
}
