"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/user";

interface RoleBadgeProps {
  role: UserRole;
}

/**
 * 役職バッジ
 * admin: 青色、editor: 緑色
 * 役職名は common.role.{role} から翻訳取得
 */
export function RoleBadge({ role }: RoleBadgeProps) {
  const t = useTranslations("common.role");

  if (role === "admin") {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        {t("admin")}
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
      {t("editor")}
    </Badge>
  );
}
