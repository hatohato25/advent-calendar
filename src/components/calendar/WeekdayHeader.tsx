"use client";

import { useTranslations } from "next-intl";

/**
 * 曜日ヘッダーコンポーネント
 * カレンダーグリッドの上部に曜日（SUN-SAT）を表示
 * デスクトップ（lg以上）のみ表示
 */
export function WeekdayHeader() {
  const t = useTranslations("calendar.grid.weekdays");

  const weekdays = [
    { key: "sun", color: "text-red-600 dark:text-red-400" },
    { key: "mon", color: "text-muted-foreground" },
    { key: "tue", color: "text-muted-foreground" },
    { key: "wed", color: "text-muted-foreground" },
    { key: "thu", color: "text-muted-foreground" },
    { key: "fri", color: "text-muted-foreground" },
    { key: "sat", color: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="hidden lg:grid grid-cols-7 gap-4 mb-2">
      {weekdays.map((day) => (
        <div key={day.key} className={`text-center text-sm font-semibold ${day.color}`}>
          {t(day.key)}
        </div>
      ))}
    </div>
  );
}
