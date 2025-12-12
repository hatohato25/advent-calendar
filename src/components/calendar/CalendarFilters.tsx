"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/routing";
import type { TagSimple } from "@/types";

interface CalendarFiltersProps {
  availableTags: TagSimple[];
  calendarSlug?: string; // カレンダーのslug（オプショナル、ホームページでは不要）
}

/**
 * カレンダーフィルタコンポーネント
 * タグでフィルタリング可能
 * URLクエリパラメータで状態管理
 */
export function CalendarFilters({ availableTags, calendarSlug }: CalendarFiltersProps) {
  const t = useTranslations("calendar.filter");
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLから初期値を取得
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tags = searchParams.get("tags");
    return tags ? tags.split(",") : [];
  });

  // フィルタ変更をURLに反映
  // WHY: カレンダーslugがある場合はカレンダーページのURLを維持し、
  // ない場合はホームページのURLを使用することで、複数カレンダー対応を実現
  const updateFilters = useCallback(
    (tags: string[]) => {
      const params = new URLSearchParams();

      if (tags.length > 0) {
        params.set("tags", tags.join(","));
      }

      const query = params.toString();
      // カレンダーslugがある場合はカレンダーページに、ない場合はホームに
      const basePath = calendarSlug ? `/calendars/${calendarSlug}` : "/";
      const newUrl = query ? `${basePath}?${query}` : basePath;

      router.push(newUrl, { scroll: false });
    },
    [router, calendarSlug],
  );

  // タグの選択/解除
  const handleTagToggle = (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug)
      ? selectedTags.filter((t) => t !== tagSlug)
      : [...selectedTags, tagSlug];

    setSelectedTags(newTags);
    updateFilters(newTags);
  };

  // フィルタのリセット
  // WHY: カレンダーページではカレンダーページに、ホームではホームに戻ることで、
  // ユーザーが元のページから離れないようにする
  const handleReset = () => {
    setSelectedTags([]);
    const basePath = calendarSlug ? `/calendars/${calendarSlug}` : "/";
    router.push(basePath, { scroll: false });
  };

  // アクティブなフィルタがあるかどうか
  const hasActiveFilters = selectedTags.length > 0;

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="space-y-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("title")}</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2 text-xs">
                <X className="mr-1 h-3 w-3" />
                {t("reset")}
              </Button>
            )}
          </div>

          {/* タグフィルタ */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("selectTag")}</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.slug);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleTagToggle(tag.slug)}
                    >
                      {tag.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* アクティブなフィルタの表示 */}
          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {t("activeCount", { count: selectedTags.length })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
