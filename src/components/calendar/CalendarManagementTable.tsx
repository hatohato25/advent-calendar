"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import type { CalendarWithStats } from "@/types/calendar";

interface CalendarManagementTableProps {
  calendars: CalendarWithStats[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (calendar: CalendarWithStats) => void;
}

/**
 * カレンダー管理テーブル
 * カレンダーの一覧を表示し、編集・削除操作を提供
 *
 * WHY: 管理者がカレンダーの全体像を把握しやすくする
 * WHY: 記事数を表示することで、各カレンダーの充実度を可視化
 */
export function CalendarManagementTable({
  calendars,
  onDelete,
  onEdit,
}: CalendarManagementTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<CalendarWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = useTranslations("calendar.table");
  const tCommon = useTranslations("common.table");
  const tStatus = useTranslations("common.status");
  const tButton = useTranslations("common.button");
  const tDialog = useTranslations("common.dialog");
  const tManagement = useTranslations("calendar.management");

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (calendars.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{t("noCalendars")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="w-[100px]">{t("year")}</TableHead>
              <TableHead className="w-[120px]">{t("articleCount")}</TableHead>
              <TableHead className="w-[100px]">{t("state")}</TableHead>
              <TableHead className="w-[150px]">{t("createdAt")}</TableHead>
              <TableHead className="w-[80px] text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calendars.map((calendar) => (
              <TableRow key={calendar.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/admin/calendars/${calendar.slug}`}
                      className="font-medium hover:underline"
                    >
                      {calendar.name}
                    </Link>
                    {calendar.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {calendar.description}
                      </p>
                    )}
                    {calendar.theme && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {tManagement("themeLabel")} {calendar.theme}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{calendar.year}</TableCell>
                <TableCell>
                  <span className="font-medium">{calendar.articleCount}</span>
                  <span className="text-muted-foreground"> / 25</span>
                </TableCell>
                <TableCell>
                  {calendar.isPublished ? (
                    <Badge variant="default">{tStatus("published")}</Badge>
                  ) : (
                    <Badge variant="secondary">{tStatus("unpublished")}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(calendar.createdAt), "yyyy/MM/dd", {
                    locale: ja,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t("openMenu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{tCommon("actions")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/calendars/${calendar.slug}`}>{t("viewPublic")}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/calendars/${calendar.slug}`}>{t("managePosts")}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onEdit(calendar)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {tButton("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDeleteTarget(calendar)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tButton("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget && tDialog("confirmDeleteWithName", { name: deleteTarget.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  <span className="block mb-2">
                    {tManagement("confirmDeleteArticles", { count: deleteTarget.articleCount })}
                  </span>
                  <span className="block font-medium text-red-600 dark:text-red-400">
                    {tDialog("cannotUndo")}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tButton("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? tButton("deleting") : tButton("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
