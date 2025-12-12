import { chromium, devices } from '@playwright/test';
import { checkServerRunning } from '../utils/server-check';
import { generateScreenshotPath } from '../utils/paths';

async function takeScreenshots() {
  // 開発サーバー起動チェック
  const isServerRunning = await checkServerRunning('http://localhost:3000');
  if (!isServerRunning) {
    console.error('❌ Next.js開発サーバーが起動していません');
    console.error('   `npm run dev` を実行してください');
    process.exit(1);
  }

  console.log('✅ Next.js開発サーバーを検出しました');
  console.log('📸 スクリーンショット撮影を開始します...\n');

  // ブラウザ起動
  const browser = await chromium.launch({ headless: true });

  // デスクトップビュー
  const desktopContext = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 },
  });
  const desktopPage = await desktopContext.newPage();

  // カレンダー一覧ページ
  console.log('  - カレンダー一覧ページ（デスクトップ）');
  await desktopPage.goto('http://localhost:3000');
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.screenshot({
    path: generateScreenshotPath('desktop', 'light', 'calendar'),
    fullPage: true,
  });

  // 記事詳細ページ（存在する場合）
  console.log('  - 記事詳細ページ（デスクトップ）');
  try {
    await desktopPage.goto('http://localhost:3000/posts/1');
    await desktopPage.waitForLoadState('networkidle');
    await desktopPage.screenshot({
      path: generateScreenshotPath('desktop', 'light', 'post-1'),
      fullPage: true,
    });
  } catch (error) {
    console.log('    （記事が存在しないためスキップ）');
  }

  // 管理ページログイン画面
  console.log('  - 管理ページログイン画面（デスクトップ）');
  try {
    await desktopPage.goto('http://localhost:3000/admin/login');
    await desktopPage.waitForLoadState('networkidle');
    await desktopPage.screenshot({
      path: generateScreenshotPath('desktop', 'light', 'admin-login'),
      fullPage: true,
    });
  } catch (error) {
    console.log('    （管理ページが存在しないためスキップ）');
  }

  await desktopContext.close();

  // モバイルビュー
  const mobileContext = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const mobilePage = await mobileContext.newPage();

  console.log('  - カレンダー一覧ページ（モバイル）');
  await mobilePage.goto('http://localhost:3000');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.screenshot({
    path: generateScreenshotPath('mobile', 'light', 'calendar'),
    fullPage: true,
  });

  await mobileContext.close();
  await browser.close();

  console.log('\n✅ スクリーンショット撮影が完了しました');
  console.log('   保存先: ./screenshots/');
}

takeScreenshots().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
