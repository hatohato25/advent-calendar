/**
 * サーバー起動チェック関数
 * @param url チェックするURL
 * @returns サーバーが起動している場合はtrue、それ以外はfalse
 */
export async function checkServerRunning(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
