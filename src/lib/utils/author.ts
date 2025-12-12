/**
 * 投稿者情報のユーティリティ関数
 * displayNameとusernameのフォールバック処理を提供
 */

/**
 * ユーザーの表示名を取得
 * displayNameが設定されている場合はそれを返し、なければusernameを返す
 *
 * WHY: displayNameはオプションフィールドなので、未設定の場合にusernameにフォールバックする必要がある
 */
export function getDisplayName(user: { username: string; displayName?: string | null }): string {
  return user.displayName || user.username;
}
