/**
 * アバター画像URL生成ユーティリティ
 * UI Avatarsを使用してユーザー名から自動生成
 */

/**
 * UI AvatarsのURLを生成する
 * @param name ユーザー名
 * @param size 画像サイズ（px）
 * @param background 背景色（'random' or HEX色）
 * @returns アバターURL
 *
 * WHY: UI Avatarsは設定不要でユーザー名から自動的にアバター画像を生成できる
 * 別途Gravatarやカスタムアップロード機能を実装する必要がない
 */
export function generateAvatarUrl(
  name: string,
  size: number = 128,
  background: string = "random",
): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=${background}&size=${size}&color=fff&bold=true`;
}

/**
 * ユーザーのアバターURLを取得
 * avatarUrlが設定されている場合はそれを返し、なければUI Avatarsで生成
 *
 * WHY: カスタムアバター対応のため、avatarUrlがあればそれを優先し、なければ従来のUI Avatarsを使用
 * WHY: displayNameが設定されている場合はそれを使用することで、より個性的なアバターを生成
 *
 * @param user ユーザー情報（username, displayName, avatarUrl）
 * @param size 画像サイズ（px）
 * @returns アバターURL
 */
export function getAvatarUrl(
  user: {
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  },
  size: number = 128,
): string {
  // カスタムアバターが設定されている場合はそれを返す
  if (user.avatarUrl) {
    return user.avatarUrl;
  }

  // UI Avatarsで生成（displayNameがあればそれを使用、なければusername）
  const name = user.displayName || user.username;
  return generateAvatarUrl(name, size);
}

/**
 * カスタムアバター画像かどうかを判定
 * UI Avatarsで生成されたURLでなければカスタムアバターとみなす
 *
 * WHY: ユーザーが設定したカスタムアイコンを優先表示するため、UI Avatars以外のURLを持つ場合にカスタムアバターと判定
 * WHY: UI Avatarsは一時的な自動生成アバターなので、カスタムアバターとは区別する必要がある
 *
 * @param avatarUrl - アバター画像のURL（null/undefined可）
 * @returns カスタムアバターの場合true、UI Avatarsまたはnullの場合false
 *
 * @example
 * isCustomAvatar("https://example.com/avatar.jpg") // true
 * isCustomAvatar("https://ui-avatars.com/api/?name=...") // false
 * isCustomAvatar(null) // false
 */
export function isCustomAvatar(avatarUrl: string | null | undefined): boolean {
  if (!avatarUrl) return false;
  return !avatarUrl.startsWith("https://ui-avatars.com/api/");
}
