import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  // Performance API エラーを回避するための設定
  // Next.js 16 の内部パフォーマンス計測機能で発生する
  // "cannot have a negative time stamp" エラーを防ぐ
  experimental: {
    // コンポーネントレベルのパフォーマンス計測を無効化
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  // React の strict mode を有効化（開発時の警告検出のため）
  reactStrictMode: true,
  // 外部画像の最適化設定
  // WHY: UI Avatars等の外部サービスをnext/imageで使用するため
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },
  // Prisma 7とlibsqlのバージョン不整合を解決するため
  // これらのパッケージをNext.jsのバンドルから除外し、Node.jsで直接実行
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
  ],
};

// バンドルアナライザーの設定（ANALYZE=trueの時のみ有効化）
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(withNextIntl(nextConfig));
