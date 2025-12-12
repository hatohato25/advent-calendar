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

interface AdminCalendarSelectorProps {
  calendars: Calendar[];
  currentSlug: string;
  useQueryParam?: boolean;
}

/**
 * 管理画面用カレンダーセレクター
 * WHY: クエリパラメータでカレンダーを切り替える機能を提供（/admin?calendar=slug形式）
 * WHY: Server ComponentからClient Componentへの関数渡しを避けるため、専用コンポーネントを用意
 */
export function AdminCalendarSelector({
  calendars,
  currentSlug,
  useQueryParam = true,
}: AdminCalendarSelectorProps) {
  const router = useRouter();

  const handleValueChange = (slug: string) => {
    if (useQueryParam) {
      // クエリパラメータ方式: /admin?calendar=slug
      router.push(`/admin?calendar=${slug}`);
    } else {
      // パス方式: /admin/calendars/slug（将来的に使う可能性のため残す）
      router.push(`/admin/calendars/${slug}`);
    }
  };

  if (calendars.length === 0) {
    return <div className="text-sm text-muted-foreground">カレンダーがありません</div>;
  }

  return (
    <Select value={currentSlug} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
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
