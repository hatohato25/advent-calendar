"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { generateAvatarUrl, getAvatarUrl, isCustomAvatar } from "@/lib/avatar";
import { getDisplayName } from "@/lib/utils/author";
import { extractFirstEmoji } from "@/lib/utils/emoji";
import type { ArticleListItem } from "@/types";

interface CalendarDayProps {
  date: number;
  article?: ArticleListItem;
  isToday: boolean;
  calendarSlug?: string; // カレンダーのslug（記事詳細リンクに使用）
}

/**
 * カレンダーの1日分のセル
 * 記事がある場合はアバター、著者名、タイトル（ホバー時）を表示
 * 下書き記事の場合は視覚的に区別し、クリック不可にする
 * 未公開の場合はプレースホルダーアイコンを表示
 * 当日の場合は強調表示（パルスアニメーション付き）
 *
 * WHY: calendarSlugがある場合は複数カレンダー対応のURL、ない場合は従来のURLを生成
 */
export function CalendarDay({ date, article, isToday, calendarSlug }: CalendarDayProps) {
  const t = useTranslations("calendar.grid");
  const tStatus = useTranslations("common.status");
  const isDraft = article?.status === "draft";

  const content = (
    <Card
      className={`
        h-full transition-all duration-300 relative
        ${article && !isDraft ? "cursor-pointer hover:shadow-lg hover:scale-105" : "cursor-default"}
        ${isDraft ? "opacity-70 border-orange-300 dark:border-orange-700 cursor-not-allowed" : ""}
        ${isToday ? "ring-2 ring-primary animate-pulse-slow" : ""}
      `}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 p-4 h-full">
        {/* 日付表示（左上） */}
        <div className="absolute top-2 left-2">
          <span
            className={`text-sm font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}
          >
            {date}
          </span>
        </div>

        {/* 今日バッジ（右上） */}
        {isToday && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="text-xs">
              {t("today")}
            </Badge>
          </div>
        )}

        {/* 記事がある場合 */}
        {article ? (
          <>
            {/* アイコン表示（カスタムアイコン → 絵文字 → UI Avatars の順） */}
            {(() => {
              // WHY: ユーザーがカスタムアイコンを設定した場合は、その意図を尊重して最優先で表示
              // 1. カスタムアイコンが設定されている場合は優先表示
              if (article.author && isCustomAvatar(article.author.avatarUrl)) {
                return (
                  <Avatar className="w-16 h-16 md:w-20 md:h-20">
                    <AvatarImage
                      src={getAvatarUrl(article.author, 128)}
                      alt={getDisplayName(article.author)}
                      loading="lazy"
                    />
                    <AvatarFallback>
                      {getDisplayName(article.author).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                );
              }

              // 2. タイトルから絵文字を抽出
              const emoji = extractFirstEmoji(article.title);

              // WHY: 記事タイトルに絵文字がある場合は絵文字を大きく表示し、視覚的な識別性を向上
              if (emoji) {
                return (
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-4xl md:text-5xl">
                    {emoji}
                  </div>
                );
              }

              // 3. UI Avatars を表示
              return (
                <Avatar className="w-16 h-16 md:w-20 md:h-20">
                  <AvatarImage
                    src={
                      article.author
                        ? getAvatarUrl(article.author, 128)
                        : generateAvatarUrl("Unknown", 128)
                    }
                    alt={article.author ? getDisplayName(article.author) : "Unknown"}
                    loading="lazy"
                  />
                  <AvatarFallback>
                    {article.author ? getDisplayName(article.author).charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              );
            })()}

            {/* 著者名 */}
            {article.author && (
              <p className="text-xs font-medium text-center truncate w-full">
                {getDisplayName(article.author)}
              </p>
            )}

            {/* 下書きバッジ */}
            {isDraft && (
              <Badge
                variant="outline"
                className="border-orange-400 text-orange-600 dark:border-orange-500 dark:text-orange-400 text-xs"
              >
                {tStatus("draft")}
              </Badge>
            )}

            {/* タイトル（ホバー時にオーバーレイで表示） */}
            <div className="opacity-0 hover:opacity-100 absolute inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 transition-opacity duration-300 rounded-lg">
              <p className="text-xs font-semibold text-white text-center line-clamp-3">
                {article.title}
              </p>
            </div>
          </>
        ) : (
          /* 記事がない場合 */
          <>
            {/* プレースホルダーアイコン */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label={t("unpublished")}
              >
                <title>{t("unpublished")}</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            {/* 未公開表示 */}
            <p className="text-xs text-muted-foreground">{t("unpublished")}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  // 公開記事の場合のみリンクでラップ
  if (article && !isDraft) {
    // カレンダーslugがある場合は新URL、ない場合は従来のURL
    const href = calendarSlug ? `/calendars/${calendarSlug}/posts/${date}` : `/posts/${date}`;

    return (
      <Link href={href} className="block h-full min-h-[180px]">
        {content}
      </Link>
    );
  }

  return <div className="h-full min-h-[180px]">{content}</div>;
}
