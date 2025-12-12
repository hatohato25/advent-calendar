"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ArticleListItem, TagSimple } from "@/types";
import { CalendarDay } from "./CalendarDay";
import { CalendarFilters } from "./CalendarFilters";
import { WeekdayHeader } from "./WeekdayHeader";

/**
 * 条件に一致する記事がない場合のメッセージ
 */
function NoMatchingArticles() {
  const t = useTranslations("calendar.grid");
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{t("noMatchingArticles")}</p>
    </div>
  );
}

interface CalendarGridClientProps {
  articles: ArticleListItem[];
  availableTags: TagSimple[];
  calendarSlug?: string; // カレンダーのslug（記事詳細リンクに使用）
}

/**
 * カレンダーグリッド（クライアントコンポーネント版）
 * フィルタリング機能を含む
 * デスクトップ: 7列グリッド（曜日ヘッダー付き）
 * タブレット: 4列グリッド
 * モバイル: 2列グリッド
 *
 * WHY: calendarSlugを受け取ることで、複数カレンダー対応のURLを生成
 */
export function CalendarGridClient({
  articles,
  availableTags,
  calendarSlug,
}: CalendarGridClientProps) {
  const searchParams = useSearchParams();

  // フィルタパラメータを取得
  const selectedTagSlugs = useMemo(() => {
    const tags = searchParams.get("tags");
    return tags ? tags.split(",") : [];
  }, [searchParams]);

  // 記事をフィルタリング
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // タグでフィルタ
    if (selectedTagSlugs.length > 0) {
      filtered = filtered.filter((article) =>
        article.tags.some((tag) => selectedTagSlugs.includes(tag.slug)),
      );
    }

    return filtered;
  }, [articles, selectedTagSlugs]);

  // 記事を日付でマッピング
  const articlesByDate = useMemo(() => {
    const map = new Map<number, ArticleListItem>();
    for (const article of filteredArticles) {
      map.set(article.date, article);
    }
    return map;
  }, [filteredArticles]);

  // 今日の日付を取得（12月の場合のみ）
  const today = new Date();
  const isDecember = today.getMonth() === 11; // 月は0始まり
  const todayDate = isDecember ? today.getDate() : -1;

  // 12月1日の曜日を取得（0: 日曜日, 1: 月曜日, ...）
  const year = new Date().getFullYear();
  const firstDay = new Date(year, 11, 1); // 12月1日
  const firstDayOfWeek = firstDay.getDay();

  // 空白セルの数を計算（12月1日までの曜日分）
  const emptySpaces = firstDayOfWeek;

  // 1〜25の配列を作成（常にすべての日付を表示）
  const visibleDays = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <>
      {/* フィルタUI */}
      <CalendarFilters availableTags={availableTags} calendarSlug={calendarSlug} />

      {/* カレンダーグリッド */}
      {visibleDays.length === 0 ? (
        <NoMatchingArticles />
      ) : (
        <div>
          {/* 曜日ヘッダー（デスクトップのみ） */}
          <WeekdayHeader />

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            {/* 空白セル（12月1日までの曜日分、デスクトップのみ） */}
            {Array.from({ length: emptySpaces }).map((_, i) => (
              <div key={`empty-${i}`} className="hidden lg:block" />
            ))}

            {/* 日付セル */}
            {visibleDays.map((date) => (
              <CalendarDay
                key={date}
                date={date}
                article={articlesByDate.get(date)}
                isToday={date === todayDate}
                calendarSlug={calendarSlug}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
