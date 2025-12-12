import { type Page, chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { checkServerRunning } from '../utils/server-check';

// .envファイルを読み込む
dotenv.config();

/**
 * 認証が必要なページを含む全ページのスクリーンショットを取得するスクリプト
 * .envファイルから管理者の認証情報を読み込む
 *
 * 使い方:
 * npm run debug:screenshot:all-auth
 */

interface PageInfo {
  name: string;
  url: string;
  requiresAuth?: boolean;
  description: string;
}

const pages: PageInfo[] = [
  // 公開ページ
  {
    name: '01-home',
    url: 'http://localhost:3000/ja',
    description: 'ホーム（カレンダー一覧）',
  },
  {
    name: '02-calendar-detail',
    url: 'http://localhost:3000/ja/calendars/advent-2025',
    description: 'カレンダー詳細',
  },
  {
    name: '03-post-detail',
    url: 'http://localhost:3000/ja/calendars/advent-2025/posts/1',
    description: '記事詳細',
  },

  // 認証ページ
  {
    name: '04-admin-login',
    url: 'http://localhost:3000/ja/admin/login',
    description: '管理者ログイン',
  },
  {
    name: '05-first-login',
    url: 'http://localhost:3000/ja/auth/first-login',
    description: '初回ログイン（パスワード設定）',
  },

  // 管理ページ（認証が必要）
  {
    name: '06-admin-dashboard',
    url: 'http://localhost:3000/ja/admin',
    requiresAuth: true,
    description: '管理ダッシュボード（記事管理）',
  },
  {
    name: '07-admin-calendars',
    url: 'http://localhost:3000/ja/admin/calendars',
    requiresAuth: true,
    description: 'カレンダー管理',
  },
  {
    name: '08-admin-calendar-detail',
    url: 'http://localhost:3000/ja/admin/calendars/advent-2025',
    requiresAuth: true,
    description: 'カレンダー詳細（管理）',
  },
  {
    name: '09-admin-post-new',
    url: 'http://localhost:3000/ja/admin/calendars/advent-2025/posts/new',
    requiresAuth: true,
    description: '記事作成',
  },
  {
    name: '10-admin-post-edit',
    url: 'http://localhost:3000/ja/admin/calendars/advent-2025/posts/cmhyez6dr0004s90byeqhi0xg',
    requiresAuth: true,
    description: '記事編集',
  },
  {
    name: '11-admin-post-preview',
    url: 'http://localhost:3000/ja/admin/posts/cmhyez6dr0004s90byeqhi0xg/preview',
    requiresAuth: true,
    description: '記事プレビュー',
  },
  {
    name: '12-admin-posts',
    url: 'http://localhost:3000/ja/admin/posts',
    requiresAuth: true,
    description: '記事一覧',
  },
  {
    name: '13-admin-users',
    url: 'http://localhost:3000/ja/admin/users',
    requiresAuth: true,
    description: 'ユーザー管理',
  },
  {
    name: '14-admin-tags',
    url: 'http://localhost:3000/ja/admin/tags',
    requiresAuth: true,
    description: 'タグ管理',
  },
  {
    name: '15-admin-import',
    url: 'http://localhost:3000/ja/admin/import',
    requiresAuth: true,
    description: 'データインポート',
  },
];

async function login(page: Page, email: string, password: string) {
  console.log('🔐 管理者としてログイン中...');

  await page.goto('http://localhost:3000/ja/admin/login');
  await page.waitForLoadState('networkidle');

  // メールアドレスとパスワードを入力
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // ログインボタンをクリック
  await page.click('button[type="submit"]');

  // ログイン完了を待つ（リダイレクト先のURLを確認）
  await page.waitForURL('**/admin', { timeout: 10000 });

  console.log('✅ ログイン成功\n');
}

async function takeScreenshots() {
  // .envファイルから認証情報を取得
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌ 認証情報が設定されていません');
    console.error('   .envファイルに ADMIN_EMAIL と ADMIN_PASSWORD を設定してください\n');
    process.exit(1);
  }

  // 開発サーバー起動チェック
  const isServerRunning = await checkServerRunning('http://localhost:3000');
  if (!isServerRunning) {
    console.error('❌ Next.js開発サーバーが起動していません');
    console.error('   `npm run dev` を実行してください');
    process.exit(1);
  }

  console.log('✅ Next.js開発サーバーを検出しました');
  console.log('📸 全ページのスクリーンショット撮影を開始します...\n');

  // 出力ディレクトリを作成
  const outputDir = path.join(process.cwd(), 'screenshots', 'all-pages');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ブラウザ起動
  const browser = await chromium.launch({ headless: false });

  // デスクトップビュー（1920x1080）
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // 管理者としてログイン
  await login(page, adminEmail, adminPassword);

  let successCount = 0;
  let errorCount = 0;

  for (const pageInfo of pages) {
    try {
      console.log(`📸 ${pageInfo.name}: ${pageInfo.description}`);
      console.log(`   URL: ${pageInfo.url}`);

      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 15000 });

      // ページが読み込まれるまで待機
      await page.waitForTimeout(2000);

      // スクリーンショットを保存
      const screenshotPath = path.join(outputDir, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`   ✅ 保存完了: ${screenshotPath}\n`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ エラー: ${error instanceof Error ? error.message : String(error)}\n`);
      errorCount++;
    }
  }

  await context.close();
  await browser.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 スクリーンショット撮影完了');
  console.log(`   成功: ${successCount}ページ`);
  console.log(`   エラー: ${errorCount}ページ`);
  console.log(`   保存先: ${outputDir}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

takeScreenshots().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
