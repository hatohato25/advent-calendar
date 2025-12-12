import { chromium } from '@playwright/test';
import { checkServerRunning } from '../utils/server-check';

async function checkPerformanceError() {
  // 開発サーバー起動チェック
  const isServerRunning = await checkServerRunning('http://localhost:3000');
  if (!isServerRunning) {
    console.error('❌ Next.js開発サーバーが起動していません');
    console.error('   `npm run dev` を実行してください');
    process.exit(1);
  }

  console.log('✅ Next.js開発サーバーを検出しました');
  console.log('🔍 Performance API エラーをチェックします...\n');

  // ブラウザ起動
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // コンソールエラーを監視
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('  ❌ エラー:', msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log('  ❌ ページエラー:', error.message);
  });

  // カレンダー一覧ページにアクセス
  console.log('1. カレンダー一覧ページにアクセス');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 記事詳細ページにアクセス（画像を含む記事）
  console.log('\n2. 記事詳細ページにアクセス（advent-2025/posts/3）');
  await page.goto('http://localhost:3000/calendars/advent-2025/posts/3');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 別の記事ページにアクセス
  console.log('\n3. 別の記事ページにアクセス（advent-2025-serverside/posts/1）');
  try {
    await page.goto('http://localhost:3000/calendars/advent-2025-serverside/posts/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  } catch (error) {
    console.log('  （記事が存在しないためスキップ）');
  }

  console.log('\n✅ チェック完了');
  console.log(`   検出されたエラー数: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n📋 エラー一覧:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });

    // Performance API エラーを特定
    const performanceErrors = errors.filter((error) =>
      error.includes('Performance') || error.includes('measure') || error.includes('negative time stamp')
    );

    if (performanceErrors.length > 0) {
      console.log('\n⚠️  Performance API エラーが検出されました:');
      performanceErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
  } else {
    console.log('   🎉 エラーは検出されませんでした！');
  }

  // ブラウザを閉じずに待機（手動確認のため）
  console.log('\n⏸  ブラウザを開いたままにします（Ctrl+C で終了）');
  await page.waitForTimeout(60000);

  await browser.close();
}

checkPerformanceError().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
