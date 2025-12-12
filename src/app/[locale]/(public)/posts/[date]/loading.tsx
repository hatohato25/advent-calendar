/**
 * 記事詳細ページ用ローディングスケルトン
 */
export default function Loading() {
  return (
    <div className="container py-8">
      <article className="mx-auto max-w-3xl animate-pulse">
        {/* タイトル */}
        <div className="h-12 bg-muted rounded-lg mb-4" />

        {/* メタデータ */}
        <div className="mb-8 flex gap-4">
          <div className="h-5 bg-muted rounded w-24" />
          <div className="h-5 bg-muted rounded w-32" />
          <div className="h-5 bg-muted rounded w-20" />
        </div>

        {/* 本文スケルトン */}
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-4/5" />
          <div className="h-8 bg-muted rounded my-6" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>

        {/* ナビゲーションスケルトン */}
        <div className="mt-12 pt-8 border-t flex justify-between">
          <div className="h-10 bg-muted rounded w-32" />
          <div className="h-10 bg-muted rounded w-32" />
        </div>
      </article>
    </div>
  );
}
