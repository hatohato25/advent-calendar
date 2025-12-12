import { chromium } from '@playwright/test';
import { checkServerRunning } from '../utils/server-check';
import { generateScreenshotPath } from '../utils/paths';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 全ページのスクリーンショットを取得するスクリプト
 * Figmaでの画面遷移図作成用
 */

interface PageInfo {
  name: string;
  url: string;
  requiresAuth?: boolean;
  requiresSetup?: boolean; // データベースにデータが必要
  description: string;
}

// スクリーンショットを取得するページのリスト
const pages: PageInfo[] = [
  // 公開ページ
  {
    name: 'home',
    url: 'http://localhost:3000/ja',
    description: 'ホーム（カレンダー一覧）',
  },
  {
    name: 'calendar-detail',
    url: 'http://localhost:3000/ja/calendars/advent-2024',
    requiresSetup: true,
    description: 'カレンダー詳細',
  },
  {
    name: 'post-detail',
    url: 'http://localhost:3000/ja/calendars/advent-2024/posts/2024-12-01',
    requiresSetup: true,
    description: '記事詳細',
  },

  // 認証ページ
  {
    name: 'admin-login',
    url: 'http://localhost:3000/ja/admin/login',
    description: '管理者ログイン',
  },
  {
    name: 'first-login',
    url: 'http://localhost:3000/ja/auth/first-login',
    description: '初回ログイン（パスワード設定）',
  },

  // 管理ページ（認証が必要）
  {
    name: 'admin-dashboard',
    url: 'http://localhost:3000/ja/admin',
    requiresAuth: true,
    description: '管理ダッシュボード（記事管理）',
  },
  {
    name: 'admin-calendars',
    url: 'http://localhost:3000/ja/admin/calendars',
    requiresAuth: true,
    description: 'カレンダー管理',
  },
  {
    name: 'admin-calendar-detail',
    url: 'http://localhost:3000/ja/admin/calendars/advent-2024',
    requiresAuth: true,
    requiresSetup: true,
    description: 'カレンダー詳細（管理）',
  },
  {
    name: 'admin-post-new',
    url: 'http://localhost:3000/ja/admin/calendars/advent-2024/posts/new',
    requiresAuth: true,
    requiresSetup: true,
    description: '記事作成',
  },
  {
    name: 'admin-post-edit',
    url: 'http://localhost:3000/ja/admin/calendars/advent-2024/posts/1',
    requiresAuth: true,
    requiresSetup: true,
    description: '記事編集',
  },
  {
    name: 'admin-post-preview',
    url: 'http://localhost:3000/ja/admin/posts/1/preview',
    requiresAuth: true,
    requiresSetup: true,
    description: '記事プレビュー',
  },
  {
    name: 'admin-posts',
    url: 'http://localhost:3000/ja/admin/posts',
    requiresAuth: true,
    description: '記事一覧',
  },
  {
    name: 'admin-users',
    url: 'http://localhost:3000/ja/admin/users',
    requiresAuth: true,
    description: 'ユーザー管理',
  },
  {
    name: 'admin-tags',
    url: 'http://localhost:3000/ja/admin/tags',
    requiresAuth: true,
    description: 'タグ管理',
  },
  {
    name: 'admin-import',
    url: 'http://localhost:3000/ja/admin/import',
    requiresAuth: true,
    description: 'データインポート',
  },
];

async function takeScreenshots() {
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
  const browser = await chromium.launch({ headless: false }); // デバッグ用にheadless: false

  // デスクトップビュー（1920x1080）
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  let successCount = 0;
  let skipCount = 0;

  for (const pageInfo of pages) {
    try {
      console.log(`📸 ${pageInfo.name}: ${pageInfo.description}`);
      console.log(`   URL: ${pageInfo.url}`);

      if (pageInfo.requiresAuth) {
        console.log('   ⚠️  認証が必要 - スキップ（後で手動でログイン後に実行してください）');
        skipCount++;
        continue;
      }

      if (pageInfo.requiresSetup) {
        console.log('   ⚠️  データベースにデータが必要 - アクセスを試みます');
      }

      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 10000 });

      // ページが読み込まれるまで待機
      await page.waitForTimeout(1000);

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
      skipCount++;
    }
  }

  await context.close();
  await browser.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 スクリーンショット撮影完了');
  console.log(`   成功: ${successCount}ページ`);
  console.log(`   スキップ: ${skipCount}ページ`);
  console.log(`   保存先: ${outputDir}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (skipCount > 0) {
    console.log('⚠️  認証が必要なページをスキップしました');
    console.log('   認証ページのスクリーンショットを取得するには:');
    console.log('   1. ブラウザで http://localhost:3000/ja/admin/login にアクセス');
    console.log('   2. ログインしてセッションを確立');
    console.log('   3. このスクリプトを再実行\n');
  }
}

takeScreenshots().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
