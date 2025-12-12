/**
 * 画像バリデーション共通ユーティリティ
 *
 * WHY: 画像アップロードAPIで重複していたバリデーションロジックを統合し、
 * 保守性を向上させるため
 */

/**
 * 許可される画像のMIMEタイプ
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/**
 * Magic number検証
 *
 * WHY: MIMEタイプは偽装可能なため、ファイルヘッダーバイトを検証してセキュリティを強化
 *
 * @param buffer 検証対象のファイルバッファ
 * @returns 有効な画像ファイルの場合true
 */
export function validateImageMagicNumber(buffer: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: 52 49 46 46 (RIFF) + 57 45 42 50 (WEBP) at offset 8
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  }

  return false;
}
