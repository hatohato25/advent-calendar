import { chromium, devices } from '@playwright/test';
import { checkServerRunning } from '../utils/server-check';
import { generateScreenshotPath } from '../utils/paths';

async function takeScreenshotsDark() {
  const isServerRunning = await checkServerRunning('http://localhost:3000');
  if (!isServerRunning) {
    console.error('❌ Next.js開発サーバーが起動していません');
    console.error('   `npm run dev` を実行してください');
    process.exit(1);
  }

  console.log('✅ Next.js開発サーバーを検出しました');
  console.log('🌙 ダークモードスクリーンショット撮影を開始します...\n');

  const browser = await chromium.launch({ headless: true });

  // ダークモード設定
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // ダークモードをlocalStorageに設定
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
  });

  // カレンダー一覧ページ（リロードしてダークモード適用）
  console.log('  - カレンダー一覧ページ（ダークモード）');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: generateScreenshotPath('desktop', 'dark', 'calendar'),
    fullPage: true,
  });

  // 記事詳細ページ（存在する場合）
  console.log('  - 記事詳細ページ（ダークモード）');
  try {
    await page.goto('http://localhost:3000/posts/1');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: generateScreenshotPath('desktop', 'dark', 'post-1'),
      fullPage: true,
    });
  } catch (error) {
    console.log('    （記事が存在しないためスキップ）');
  }

  // 管理ページログイン画面
  console.log('  - 管理ページログイン画面（ダークモード）');
  try {
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: generateScreenshotPath('desktop', 'dark', 'admin-login'),
      fullPage: true,
    });
  } catch (error) {
    console.log('    （管理ページが存在しないためスキップ）');
  }

  await context.close();
  await browser.close();

  console.log('\n✅ ダークモードスクリーンショット撮影が完了しました');
  console.log('   保存先: ./screenshots/desktop/dark/');
}

takeScreenshotsDark().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
