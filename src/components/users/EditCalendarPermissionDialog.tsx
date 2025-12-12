"use client";

import { useEffect, useState } from "react";
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
import type { CalendarPermission } from "@/types/calendar-permission";
import { AllowedDatesSelector } from "./AllowedDatesSelector";

interface EditCalendarPermissionDialogProps {
  permission: CalendarPermission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * カレンダー権限編集ダイアログ
 * 許可日程の編集のみ可能（カレンダーは変更不可）
 */
export function EditCalendarPermissionDialog({
  permission,
  open,
  onOpenChange,
  onSuccess,
}: EditCalendarPermissionDialogProps) {
  const [dateMode, setDateMode] = useState<"all" | "specific">("specific");
  const [allowedDates, setAllowedDates] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 権限が変更されたら初期値を設定
  useEffect(() => {
    if (permission) {
      const isAllDates = permission.allowedDates.length === 25;
      setDateMode(isAllDates ? "all" : "specific");
      setAllowedDates(permission.allowedDates);
      setError(null);
    }
  }, [permission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permission) return;

    setLoading(true);
    setError(null);

    try {
      const dates = dateMode === "all" ? Array.from({ length: 25 }, (_, i) => i + 1) : allowedDates;

      if (dates.length === 0) {
        throw new Error("最低1つの日程を選択してください");
      }

      const response = await fetch(`/api/users/${permission.userId}/calendars/${permission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedDates: dates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "カレンダー権限の更新に失敗しました");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>カレンダー権限の編集</DialogTitle>
          <DialogDescription>
            許可する日程を変更します。カレンダーは変更できません。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>カレンダー</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {permission.calendar.name} ({permission.calendar.year})
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>許可日程 *</Label>
            <RadioGroup
              value={dateMode}
              onValueChange={(value) => setDateMode(value as "all" | "specific")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="edit-all-dates" />
                <Label htmlFor="edit-all-dates" className="cursor-pointer">
                  すべての日程を許可
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="edit-specific-dates" />
                <Label htmlFor="edit-specific-dates" className="cursor-pointer">
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
            <Button type="submit" disabled={loading}>
              {loading ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
