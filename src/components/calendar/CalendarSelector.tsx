"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/routing";
import type { Calendar } from "@/types/calendar";

interface CalendarSelectorProps {
  calendars: Calendar[];
  currentSlug?: string;
  basePath?: string;
  className?: string;
}

/**
 * カレンダー選択ドロップダウン
 * カレンダーを選択して切り替えるためのコンポーネント
 *
 * WHY: 管理画面と公開画面の両方で使用できる汎用的なセレクター
 * WHY: Next.js 16のServer/Client Component制約に対応するため、内部でナビゲーションを処理
 * WHY: basePathで管理画面用と公開用のパスを切り替え可能
 */
export function CalendarSelector({
  calendars,
  currentSlug,
  basePath = "/calendars",
  className,
}: CalendarSelectorProps) {
  const router = useRouter();

  const handleValueChange = (slug: string) => {
    // basePathを使ってナビゲーション
    router.push(`${basePath}/${slug}`);
  };

  if (calendars.length === 0) {
    return <div className="text-sm text-muted-foreground">カレンダーがありません</div>;
  }

  return (
    <Select value={currentSlug} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="カレンダーを選択" />
      </SelectTrigger>
      <SelectContent>
        {calendars.map((calendar) => (
          <SelectItem key={calendar.id} value={calendar.slug}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{calendar.name}</span>
              <span className="text-xs text-muted-foreground">({calendar.year})</span>
              {!calendar.isPublished && (
                <span className="text-xs text-orange-600 dark:text-orange-400">非公開</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
