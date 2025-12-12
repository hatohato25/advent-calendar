"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 管理ページ用エラーバウンダリ
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.jsのerror.tsxファイル規約に従う
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログをコンソールに出力
    console.error("Admin Error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="mx-auto max-w-2xl border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>エラーが発生しました</CardTitle>
          </div>
          <CardDescription>管理機能の実行中に問題が発生しました</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm font-mono">{error.message || "不明なエラー"}</p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">Error ID: {error.digest}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button onClick={reset}>再試行</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              ダッシュボードへ
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-semibold">トラブルシューティング:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>ネットワーク接続を確認してください</li>
              <li>セッションが切れている可能性があります。再ログインしてください</li>
              <li>ブラウザをリロードしてください</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
