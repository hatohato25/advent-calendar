"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CalendarPermission } from "@/types/calendar-permission";
import type { UserListItem } from "@/types/user";
import { AddCalendarPermissionDialog } from "./AddCalendarPermissionDialog";
import { CalendarPermissionsTable } from "./CalendarPermissionsTable";

interface CalendarPermissionsTabProps {
  user: UserListItem | null;
  onSuccess: () => void;
}

/**
 * カレンダー権限タブのメインコンテンツ
 * 権限一覧の表示と追加・編集・削除機能を提供
 */
export function CalendarPermissionsTab({ user, onSuccess }: CalendarPermissionsTabProps) {
  const t = useTranslations("admin.users.permissions");
  const tCommon = useTranslations("common");
  const [permissions, setPermissions] = useState<CalendarPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // WHY: useEffectの依存配列で使用するため、useCallbackでメモ化
  // userが変更されたときのみ再生成される
  const fetchPermissions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/calendars`);
      if (!response.ok) throw new Error("Failed to fetch permissions");

      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  if (!user) return null;

  // adminの場合は説明文のみ表示
  if (user.role === "admin") {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t("adminNote")}</p>
        <p className="text-sm text-muted-foreground mt-2">{t("editorOnly")}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">{tCommon("button.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {permissions.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">{t("noPermissions")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("addButton")}</p>
        </div>
      ) : (
        <CalendarPermissionsTable
          permissions={permissions}
          onEdit={() => {
            fetchPermissions();
            onSuccess();
          }}
          onDelete={() => {
            fetchPermissions();
            onSuccess();
          }}
        />
      )}

      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addDialogButton")}
        </Button>
      </div>

      <AddCalendarPermissionDialog
        user={user}
        existingPermissions={permissions}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          fetchPermissions();
          onSuccess();
        }}
      />
    </div>
  );
}
