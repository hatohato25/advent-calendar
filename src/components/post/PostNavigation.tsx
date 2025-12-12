"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface PostNavigationProps {
  previousArticle?: { date: number; title: string };
  nextArticle?: { date: number; title: string };
  calendarSlug?: string; // カレンダーのslug（複数カレンダー対応）
}

/**
 * 記事ナビゲーションコンポーネント
 * 前後の記事へのリンクを表示
 *
 * WHY: calendarSlugがある場合は複数カレンダー対応のURL、ない場合は従来のURLを生成
 */
export function PostNavigation({
  previousArticle,
  nextArticle,
  calendarSlug,
}: PostNavigationProps) {
  const t = useTranslations("post.detail");

  return (
    <nav className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-between">
      {/* 前の記事 */}
      <div className="flex-1">
        {previousArticle ? (
          <Link
            href={
              calendarSlug
                ? `/calendars/${calendarSlug}/posts/${previousArticle.date}`
                : `/posts/${previousArticle.date}`
            }
            className="block"
          >
            <Button variant="outline" className="w-full justify-start h-auto py-4">
              <ChevronLeft className="mr-2 h-4 w-4 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="text-xs text-muted-foreground mb-1">{t("previous")}</div>
                <div className="text-sm font-medium line-clamp-1">{previousArticle.title}</div>
              </div>
            </Button>
          </Link>
        ) : (
          <div /> // 空のdivでレイアウトを維持
        )}
      </div>

      {/* 次の記事 */}
      <div className="flex-1">
        {nextArticle ? (
          <Link
            href={
              calendarSlug
                ? `/calendars/${calendarSlug}/posts/${nextArticle.date}`
                : `/posts/${nextArticle.date}`
            }
            className="block"
          >
            <Button variant="outline" className="w-full justify-end h-auto py-4">
              <div className="text-right flex-1">
                <div className="text-xs text-muted-foreground mb-1">{t("next")}</div>
                <div className="text-sm font-medium line-clamp-1">{nextArticle.title}</div>
              </div>
              <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
            </Button>
          </Link>
        ) : (
          <div /> // 空のdivでレイアウトを維持
        )}
      </div>
    </nav>
  );
}
