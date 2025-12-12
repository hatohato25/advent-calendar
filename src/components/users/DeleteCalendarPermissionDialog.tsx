"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CalendarPermission } from "@/types/calendar-permission";

interface DeleteCalendarPermissionDialogProps {
  permission: CalendarPermission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * カレンダー権限削除確認ダイアログ
 * 削除対象の情報を表示し、確認を求める
 */
export function DeleteCalendarPermissionDialog({
  permission,
  open,
  onOpenChange,
  onSuccess,
}: DeleteCalendarPermissionDialogProps) {
  const tDialog = useTranslations("common.dialog");
  const tButton = useTranslations("common.button");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!permission) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${permission.userId}/calendars/${permission.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete permission:", error);
      alert("カレンダー権限の削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return null;

  /**
   * 許可日程をフォーマット
   * - 全25日: "すべて"
   * - 10件以下: "1, 2, 3, ..."
   * - 11件以上: "1, 2, 3, ... 他X件"
   */
  const formatDates = (dates: number[]) => {
    if (dates.length === 25) return "すべて";
    if (dates.length <= 10) return dates.join(", ");
    return `${dates.slice(0, 10).join(", ")} 他${dates.length - 10}件`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tDialog("confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>以下のカレンダー権限を削除しますか？</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">カレンダー:</span> {permission.calendar.name} (
            {permission.calendar.year})
          </div>
          <div>
            <span className="font-medium">許可日程:</span> {formatDates(permission.allowedDates)}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{tDialog("cannotUndo")}</p>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{tButton("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? tButton("deleting") : tButton("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
