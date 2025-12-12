import { chromium, devices } from '@playwright/test';
import { checkServerRunning } from '../utils/server-check';
import { generateScreenshotPath } from '../utils/paths';

async function takeScreenshotsMobile() {
  const isServerRunning = await checkServerRunning('http://localhost:3000');
  if (!isServerRunning) {
    console.error('❌ Next.js開発サーバーが起動していません');
    console.error('   `npm run dev` を実行してください');
    process.exit(1);
  }

  console.log('✅ Next.js開発サーバーを検出しました');
  console.log('📱 モバイルビュースクリーンショット撮影を開始します...\n');

  const browser = await chromium.launch({ headless: true });

  // モバイルビュー - ライトモード
  console.log('📱 ライトモード');
  const lightContext = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const lightPage = await lightContext.newPage();

  console.log('  - カレンダー一覧ページ（モバイル・ライト）');
  await lightPage.goto('http://localhost:3000');
  await lightPage.waitForLoadState('networkidle');
  await lightPage.screenshot({
    path: generateScreenshotPath('mobile', 'light', 'calendar'),
    fullPage: true,
  });

  // 記事詳細ページ（存在する場合）
  console.log('  - 記事詳細ページ（モバイル・ライト）');
  try {
    await lightPage.goto('http://localhost:3000/posts/1');
    await lightPage.waitForLoadState('networkidle');
    await lightPage.screenshot({
      path: generateScreenshotPath('mobile', 'light', 'post-1'),
      fullPage: true,
    });
  } catch (error) {
    console.log('    （記事が存在しないためスキップ）');
  }

  await lightContext.close();

  // モバイルビュー - ダークモード
  console.log('\n🌙 ダークモード');
  const darkContext = await browser.newContext({
    ...devices['Pixel 5'],
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();

  // ダークモードをlocalStorageに設定
  await darkPage.goto('http://localhost:3000');
  await darkPage.evaluate(() => {
    localStorage.setItem('theme', 'dark');
  });

  console.log('  - カレンダー一覧ページ（モバイル・ダーク）');
  await darkPage.goto('http://localhost:3000');
  await darkPage.waitForLoadState('networkidle');
  await darkPage.screenshot({
    path: generateScreenshotPath('mobile', 'dark', 'calendar'),
    fullPage: true,
  });

  // 記事詳細ページ（存在する場合）
  console.log('  - 記事詳細ページ（モバイル・ダーク）');
  try {
    await darkPage.goto('http://localhost:3000/posts/1');
    await darkPage.waitForLoadState('networkidle');
    await darkPage.screenshot({
      path: generateScreenshotPath('mobile', 'dark', 'post-1'),
      fullPage: true,
    });
  } catch (error) {
    console.log('    （記事が存在しないためスキップ）');
  }

  await darkContext.close();
  await browser.close();

  console.log('\n✅ モバイルビュースクリーンショット撮影が完了しました');
  console.log('   保存先: ./screenshots/mobile/');
}

takeScreenshotsMobile().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
