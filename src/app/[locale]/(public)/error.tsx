"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 公開ページ用エラーバウンダリ
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
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="container py-16 px-4">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>エラーが発生しました</CardTitle>
          </div>
          <CardDescription>ページの読み込み中に問題が発生しました</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || "不明なエラー"}
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={reset}>再試行</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              トップページへ
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            問題が解決しない場合は、ページをリロードしてください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
