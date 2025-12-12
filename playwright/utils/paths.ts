import { format } from 'date-fns';
import path from 'node:path';
import fs from 'node:fs';

/**
 * スクリーンショット保存パス生成関数
 * @param viewport ビューポート（desktop または mobile）
 * @param theme テーマ（light または dark）
 * @param pageName ページ名
 * @returns スクリーンショットの保存パス
 */
export function generateScreenshotPath(
  viewport: 'desktop' | 'mobile',
  theme: 'light' | 'dark',
  pageName: string
): string {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const dir = path.join(process.cwd(), 'screenshots', viewport, theme);

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return path.join(dir, `${pageName}-${timestamp}.png`);
}
