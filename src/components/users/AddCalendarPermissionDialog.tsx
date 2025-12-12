"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarPermission } from "@/types/calendar-permission";
import type { UserListItem } from "@/types/user";
import { AllowedDatesSelector } from "./AllowedDatesSelector";

interface Calendar {
  id: string;
  name: string;
  year: number;
  slug: string;
}

interface AddCalendarPermissionDialogProps {
  user: UserListItem;
  existingPermissions: CalendarPermission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * カレンダー権限追加ダイアログ
 * カレンダー選択と許可日程の設定を行う
 */
export function AddCalendarPermissionDialog({
  user,
  existingPermissions,
  open,
  onOpenChange,
  onSuccess,
}: AddCalendarPermissionDialogProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [dateMode, setDateMode] = useState<"all" | "specific">("all");
  const [allowedDates, setAllowedDates] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WHY: useEffectの依存配列で使用するため、useCallbackでメモ化
  // 毎回再生成されるとuseEffectが無限ループする
  const fetchCalendars = useCallback(async () => {
    try {
      const response = await fetch("/api/calendars");
      if (!response.ok) throw new Error("Failed to fetch calendars");

      const data = await response.json();
      setCalendars(data.calendars || []);
    } catch (error) {
      console.error("Failed to fetch calendars:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCalendars();
      // リセット
      setSelectedCalendarId("");
      setDateMode("all");
      setAllowedDates([]);
      setError(null);
    }
  }, [open, fetchCalendars]);

  // 既に権限が設定されているカレンダーIDのSet
  const existingCalendarIds = new Set(existingPermissions.map((p) => p.calendarId));

  // 選択可能なカレンダー（既存権限がないもの）
  const availableCalendars = calendars.filter((calendar) => !existingCalendarIds.has(calendar.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dates = dateMode === "all" ? Array.from({ length: 25 }, (_, i) => i + 1) : allowedDates;

      if (dates.length === 0) {
        throw new Error("最低1つの日程を選択してください");
      }

      if (!selectedCalendarId) {
        throw new Error("カレンダーを選択してください");
      }

      const response = await fetch(`/api/users/${user.id}/calendars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: selectedCalendarId,
          allowedDates: dates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "カレンダー権限の追加に失敗しました");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>カレンダー権限の追加</DialogTitle>
          <DialogDescription>
            ユーザーがアクセスできるカレンダーと許可する日程を設定します。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calendar">カレンダー *</Label>
            {availableCalendars.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                すべてのカレンダーに権限が設定されています。
              </p>
            ) : (
              <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId} required>
                <SelectTrigger>
                  <SelectValue placeholder="カレンダーを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCalendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.name} ({calendar.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>許可日程 *</Label>
            <RadioGroup
              value={dateMode}
              onValueChange={(value) => setDateMode(value as "all" | "specific")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-dates" />
                <Label htmlFor="all-dates" className="cursor-pointer">
                  すべての日程を許可
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific-dates" />
                <Label htmlFor="specific-dates" className="cursor-pointer">
                  特定の日程のみ許可
                </Label>
              </div>
            </RadioGroup>

            {dateMode === "specific" && (
              <div className="mt-4">
                <AllowedDatesSelector dates={allowedDates} onChange={setAllowedDates} />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || availableCalendars.length === 0}>
              {loading ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
