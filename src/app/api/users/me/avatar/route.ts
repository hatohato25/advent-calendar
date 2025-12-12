import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AVATAR_IMAGE_UPLOAD } from "@/lib/upload/constants";
import { deleteAvatarFile } from "@/lib/upload/file-manager";
import { validateImageMagicNumber } from "@/lib/upload/image-validation";

/**
 * POST /api/users/me/avatar
 * 現在のユーザーのアイコン画像をアップロード
 * 認証必須（admin, editor）
 *
 * WHY: 自分自身のアイコンのみ変更可能（セキュリティ）
 */
export async function POST(request: NextRequest) {
  try {
    // 1. セッション認証チェック
    const session = await requireAuth();

    // 2. FormDataを取得
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
    }

    // 3. ファイルサイズチェック（2MB以下）
    if (file.size > AVATAR_IMAGE_UPLOAD.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: AVATAR_IMAGE_UPLOAD.ERROR_MESSAGES.SIZE_EXCEEDED },
        { status: 400 },
      );
    }

    // 4. MIMEタイプチェック
    if (
      !AVATAR_IMAGE_UPLOAD.ALLOWED_MIME_TYPES.includes(
        file.type as (typeof AVATAR_IMAGE_UPLOAD.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { error: AVATAR_IMAGE_UPLOAD.ERROR_MESSAGES.INVALID_TYPE },
        { status: 400 },
      );
    }

    // 5. ファイルをバッファに変換
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Magic numberチェック
    if (!validateImageMagicNumber(buffer)) {
      return NextResponse.json({ error: "不正な画像ファイルです" }, { status: 400 });
    }

    // 7. 既存のアバター画像を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 8. 既存のアバター画像を削除（存在する場合）
    // WHY: 古いファイルを残さないことでストレージ容量を節約
    if (user.avatarUrl) {
      try {
        await deleteAvatarFile(user.avatarUrl);
      } catch (error) {
        // 削除に失敗しても続行（ログのみ）
        console.error("Failed to delete old avatar:", error);
      }
    }

    // 9. 一意なファイル名を生成
    // WHY: userId + タイムスタンプでファイル名の衝突を回避
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${session.user.id}-${timestamp}.${ext}`;

    // 10. 保存先ディレクトリを作成
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 11. ファイルパスの正規化とディレクトリトラバーサル対策
    const filePath = join(uploadDir, filename);

    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "不正なファイルパスです" }, { status: 400 });
    }

    // 12. ファイルを保存
    await writeFile(filePath, buffer);

    // 13. データベースのUser.avatarUrlを更新
    const avatarUrl = `/uploads/avatars/${filename}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    // 14. レスポンス返却
    return NextResponse.json({ avatarUrl }, { status: 201 });
  } catch (error) {
    return handleApiError(
      error,
      "POST /api/users/me/avatar",
      "アイコン画像のアップロードに失敗しました",
    );
  }
}

/**
 * DELETE /api/users/me/avatar
 * 現在のユーザーのアイコン画像を削除
 * 認証必須（admin, editor）
 */
export async function DELETE() {
  try {
    // 1. セッション認証チェック
    const session = await requireAuth();

    // 2. データベースからUser.avatarUrlを取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    if (!user.avatarUrl) {
      return NextResponse.json({ error: "アイコンが設定されていません" }, { status: 404 });
    }

    // 3. ファイルシステムから画像ファイルを削除
    await deleteAvatarFile(user.avatarUrl);

    // 4. データベースのUser.avatarUrlをNULLに更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    });

    // 5. レスポンス返却
    return NextResponse.json({ message: "アイコンを削除しました" }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "DELETE /api/users/me/avatar", "アイコン画像の削除に失敗しました");
  }
}
