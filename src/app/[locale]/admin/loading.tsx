import { Card } from "@/components/ui/card";

/**
 * 管理ページ用ローディングスケルトン
 */
export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 animate-pulse">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="h-10 bg-muted rounded-lg w-64 mb-2" />
        <div className="h-4 bg-muted rounded-lg w-96" />
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {Array.from({ length: 3 }).map((_: unknown, i: number) => (
          <Card key={`stat-${i}`} className="p-6">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-8 bg-muted rounded w-16" />
          </Card>
        ))}
      </div>

      {/* コンテンツエリア */}
      <Card className="p-6">
        <div className="h-6 bg-muted rounded w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_: unknown, i: number) => (
            <div key={`item-${i}`} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </Card>
    </div>
  );
}
