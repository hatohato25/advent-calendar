import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * ファイル管理ユーティリティ
 *
 * WHY: ファイル削除ロジックを共通化し、保守性を向上させるため
 */

/**
 * アバター画像ファイルを削除する
 *
 * @param avatarUrl 削除対象のアバターURL（例: /uploads/avatars/user-123.jpg）
 * @throws ファイル削除に失敗した場合はエラーをスロー
 *
 * WHY: POSTとDELETEの両方で同じ削除ロジックを使用するため
 */
export async function deleteAvatarFile(avatarUrl: string): Promise<void> {
  const filePath = join(process.cwd(), "public", avatarUrl);

  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}
