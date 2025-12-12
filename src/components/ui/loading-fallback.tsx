"use client";

/**
 * 統一されたローディング表示コンポーネント
 *
 * WHY: Suspenseのfallbackで使用される共通のローディング表示
 * 複数のページで重複していたLoadingFallbackコンポーネントを統合
 */

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface LoadingFallbackProps {
  /**
   * フルスクリーン表示にするかどうか
   * WHY: ページ全体のローディング（first-login）とカード内のローディング（login）に対応
   */
  fullScreen?: boolean;
}

export function LoadingFallback({ fullScreen = true }: LoadingFallbackProps) {
  const t = useTranslations("common.button");

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen bg-gradient-to-br from-background to-muted px-4",
      )}
    >
      <div className="text-center text-muted-foreground">{t("loading")}</div>
    </div>
  );
}
