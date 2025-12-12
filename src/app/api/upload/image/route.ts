import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { getSession } from "@/lib/auth";
import { ARTICLE_IMAGE_UPLOAD } from "@/lib/upload/constants";
import { validateImageMagicNumber } from "@/lib/upload/image-validation";

// ファイル名から代替テキストを生成
// WHY: アクセシビリティ向上のため、ファイル名から意味のある代替テキストを自動生成
const generateAlt = (filename: string): string => {
  // 拡張子を除去
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // ハイフン、アンダースコアをスペースに変換
  // タイムスタンプ-UUIDパターン（例: 1234567890123-a1b2c3d4）を削除
  const cleaned = nameWithoutExt
    .replace(/[-_]/g, " ")
    .replace(/\d{13}-\w{8}/g, "")
    .trim();

  // 空の場合はデフォルト値を返す
  return cleaned || "uploaded image";
};

/**
 * 画像アップロードAPI
 * POST /api/upload/image
 * 認証必須（admin, editor）
 */
export async function POST(request: NextRequest) {
  try {
    // 1. セッション認証チェック
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 2. FormDataを取得
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
    }

    // 3. ファイルサイズチェック（5MB以下）
    if (file.size > ARTICLE_IMAGE_UPLOAD.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: ARTICLE_IMAGE_UPLOAD.ERROR_MESSAGES.SIZE_EXCEEDED },
        { status: 400 },
      );
    }

    // 4. MIMEタイプチェック
    if (
      !ARTICLE_IMAGE_UPLOAD.ALLOWED_MIME_TYPES.includes(
        file.type as (typeof ARTICLE_IMAGE_UPLOAD.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { error: ARTICLE_IMAGE_UPLOAD.ERROR_MESSAGES.INVALID_TYPE },
        { status: 400 },
      );
    }

    // 5. ファイルをバッファに変換
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Magic numberチェック
    // WHY: 拡張子だけを変更した不正なファイルを検出するため
    if (!validateImageMagicNumber(buffer)) {
      return NextResponse.json({ error: "不正な画像ファイルです" }, { status: 400 });
    }

    // 7. 一意なファイル名を生成
    // WHY: タイムスタンプ + UUIDでファイル名の衝突を回避
    const timestamp = Date.now();
    const uuid = crypto.randomUUID().split("-")[0]; // UUID先頭8文字を使用
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${timestamp}-${uuid}.${ext}`;

    // 8. 保存先ディレクトリを作成
    const uploadDir = join(process.cwd(), "public", "uploads");

    // ディレクトリが存在しない場合は作成
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 9. ファイルパスの正規化とディレクトリトラバーサル対策
    // WHY: 悪意あるファイル名でディレクトリ外にファイルを保存されることを防ぐ
    const filePath = join(uploadDir, filename);

    // パスがuploadDir配下であることを確認
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "不正なファイルパスです" }, { status: 400 });
    }

    // 10. ファイルを保存
    await writeFile(filePath, buffer);

    // 11. 公開URLと代替テキストを生成
    const url = `/uploads/${filename}`;
    const alt = generateAlt(file.name);

    // 12. レスポンス返却
    return NextResponse.json({ url, alt }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/upload/image", "画像のアップロードに失敗しました");
  }
}
