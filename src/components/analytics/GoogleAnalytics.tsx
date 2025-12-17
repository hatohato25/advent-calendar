"use client";

import Script from "next/script";

/**
 * Google Analytics (gtag.js) コンポーネント
 *
 * Next.js 16 App Router対応のGoogle Analyticsトラッキング実装
 *
 * WHY: 本番環境でのみGAを有効化し、開発環境では無効化することで、
 * 開発中のテストトラフィックが分析データに混入するのを防ぐ
 *
 * @see https://nextjs.org/docs/app/api-reference/components/script
 */
export function GoogleAnalytics() {
  // 環境変数からGA IDを取得
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // GA IDが設定されていない場合は何も表示しない
  // WHY: 本番環境以外ではGA IDを設定しないことで、開発環境では自動的に無効化される
  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* Next.js Script コンポーネントを使用してパフォーマンス最適化 */}
      {/* WHY: strategy="afterInteractive" により、ページのインタラクティブ化後に読み込まれ、
           初期表示のパフォーマンスに影響を与えない */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
