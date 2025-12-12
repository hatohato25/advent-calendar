"use client";

import { Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CalendarPermission } from "@/types/calendar-permission";
import { DeleteCalendarPermissionDialog } from "./DeleteCalendarPermissionDialog";
import { EditCalendarPermissionDialog } from "./EditCalendarPermissionDialog";

interface CalendarPermissionsTableProps {
  permissions: CalendarPermission[];
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * カレンダー権限一覧テーブル
 * 各権限に対して編集・削除ボタンを表示
 */
export function CalendarPermissionsTable({
  permissions,
  onEdit,
  onDelete,
}: CalendarPermissionsTableProps) {
  const t = useTranslations("admin.users.permissions.table");
  const tCommon = useTranslations("common.table");
  const [editingPermission, setEditingPermission] = useState<CalendarPermission | null>(null);
  const [deletingPermission, setDeletingPermission] = useState<CalendarPermission | null>(null);

  /**
   * 許可日程をフォーマット
   * - 全25日: "すべて" / "All"
   * - 5件以下: "1日, 2日, 3日, 4日, 5日" / "Dec 1, Dec 2, ..."
   * - 6件以上: "1日, 2日, 3日, 4日, 5日 他X件" / "Dec 1, Dec 2, ... +X more"
   */
  const formatAllowedDates = (dates: number[]) => {
    if (dates.length === 25) {
      return t("allDates");
    }

    if (dates.length <= 5) {
      return dates.map((d) => t("dateFormat", { date: d })).join(", ");
    }

    const displayDates = dates.slice(0, 5);
    const remaining = dates.length - 5;
    return `${displayDates.map((d) => t("dateFormat", { date: d })).join(", ")} ${t("otherDates", { count: remaining })}`;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{t("calendarName")}</TableHead>
              <TableHead className="w-[15%]">{t("year")}</TableHead>
              <TableHead className="w-[30%]">{t("allowedDates")}</TableHead>
              <TableHead className="w-[15%] text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell className="min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate font-medium cursor-help">
                          {permission.calendar.name}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{permission.calendar.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{permission.calendar.year}</TableCell>
                <TableCell>{formatAllowedDates(permission.allowedDates)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPermission(permission)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingPermission(permission)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditCalendarPermissionDialog
        permission={editingPermission}
        open={!!editingPermission}
        onOpenChange={(open) => !open && setEditingPermission(null)}
        onSuccess={() => {
          setEditingPermission(null);
          onEdit();
        }}
      />

      <DeleteCalendarPermissionDialog
        permission={deletingPermission}
        open={!!deletingPermission}
        onOpenChange={(open) => !open && setDeletingPermission(null)}
        onSuccess={() => {
          setDeletingPermission(null);
          onDelete();
        }}
      />
    </>
  );
}
