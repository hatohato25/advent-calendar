"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { CalendarCreateDialog } from "@/components/calendar/CalendarCreateDialog";
import { CalendarEditDialog } from "@/components/calendar/CalendarEditDialog";
import { CalendarManagementTable } from "@/components/calendar/CalendarManagementTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CalendarWithStats } from "@/types/calendar";

/**
 * カレンダー管理ページ
 * 管理者がすべてのカレンダーを一覧表示し、作成・編集・削除を行う
 *
 * WHY: 複数カレンダーの管理を一元化
 * WHY: 統計情報（総カレンダー数、記事数など）を表示して全体像を把握しやすくする
 */
export default function CalendarsManagementPage() {
  // 翻訳の取得
  const t = useTranslations("calendar.management");
  const tStats = useTranslations("calendar.statistics");
  const tCommon = useTranslations("common");

  const [calendars, setCalendars] = useState<CalendarWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCalendar, setEditingCalendar] = useState<CalendarWithStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // カレンダー一覧を取得
  const fetchCalendars = useCallback(async () => {
    try {
      const response = await fetch("/api/calendars");
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      if (data.calendars && Array.isArray(data.calendars)) {
        setCalendars(data.calendars);
      } else {
        console.error("Invalid response format:", data);
        setCalendars([]);
      }
    } catch (error) {
      console.error("Failed to fetch calendars:", error);
      setCalendars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  // 編集ダイアログを開く
  const handleEdit = (calendar: CalendarWithStats) => {
    setEditingCalendar(calendar);
    setEditDialogOpen(true);
  };

  // カレンダー削除
  const handleDelete = async (calendarId: string) => {
    try {
      const response = await fetch(`/api/calendars/${calendarId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCalendars();
      }
    } catch (error) {
      console.error("Failed to delete calendar:", error);
    }
  };

  // 統計情報
  const stats = {
    totalCalendars: calendars.length,
    publishedCalendars: calendars.filter((c) => c.isPublished).length,
    totalArticles: calendars.reduce((sum, c) => sum + c.articleCount, 0),
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">{tCommon("button.loading")}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          <CalendarCreateDialog onSuccess={fetchCalendars} />
        </div>

        {/* 統計情報カード */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tStats("totalCalendars")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalendars}</div>
              <p className="text-xs text-muted-foreground">{tStats("totalCalendarsDescription")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tStats("publishedCalendars")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedCalendars}</div>
              <p className="text-xs text-muted-foreground">
                {tStats("publishedCalendarsDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tStats("totalArticles")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">{tStats("totalArticlesDescription")}</p>
            </CardContent>
          </Card>
        </div>

        {/* カレンダー一覧テーブル */}
        <CalendarManagementTable
          calendars={calendars}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />

        {/* 編集ダイアログ */}
        <CalendarEditDialog
          calendar={editingCalendar}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchCalendars}
        />
      </div>
    </div>
  );
}
