import { chromium } from '@playwright/test';
import { checkServerRunning } from '../utils/server-check';

async function openBrowser() {
  const isServerRunning = await checkServerRunning('http://localhost:3000');
  if (!isServerRunning) {
    console.error('❌ Next.js開発サーバーが起動していません');
    console.error('   `npm run dev` を実行してください');
    process.exit(1);
  }

  console.log('✅ Next.js開発サーバーを検出しました');
  console.log('🌐 Playwrightブラウザを起動します...');
  console.log('   （ブラウザを閉じるまで待機します）\n');

  // ヘッド付きブラウザ起動
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // アクション間の遅延（デバッグ用）
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000');

  // ブラウザが閉じられるまで待機
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: 意図的な無限待機
  await new Promise(() => {});
}

openBrowser().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
