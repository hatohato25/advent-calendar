import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストディレクトリ（E2E用、初期フェーズでは未使用）
  testDir: './playwright/tests',

  // タイムアウト設定
  timeout: 30000,

  // 並列実行設定
  fullyParallel: true,

  // リトライ設定
  retries: 0,

  // レポート設定
  reporter: 'html',

  // Webサーバー設定
  use: {
    // ベースURL
    baseURL: 'http://localhost:3000',

    // スクリーンショット設定
    screenshot: 'only-on-failure',

    // トレース設定
    trace: 'retain-on-failure',
  },

  // プロジェクト設定（ブラウザごと）
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'chromium-desktop-dark',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'chromium-mobile-dark',
      use: {
        ...devices['Pixel 5'],
        colorScheme: 'dark',
      },
    },
  ],

  // Webサーバー自動起動設定（将来CI対応時）
  // webServer: {
  //   command: 'npm run dev',
  //   port: 3000,
  //   timeout: 120000,
  //   reuseExistingServer: true,
  // },
});
