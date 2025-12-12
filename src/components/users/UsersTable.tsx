"use client";

import { Edit2, KeyRound, Trash2, Users as UsersIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserListItem } from "@/types/user";
import { RoleBadge } from "./RoleBadge";

interface UsersTableProps {
  users: UserListItem[];
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  onResetToken: (user: UserListItem) => void;
}

export function UsersTable({ users, onEdit, onDelete, onResetToken }: UsersTableProps) {
  const t = useTranslations("admin.users.table");
  const tCommon = useTranslations("common.table");
  const { data: session } = useSession();

  // usersがundefinedまたはnullの場合は空配列として扱う
  const safeUsers = users || [];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("username")}</TableHead>
            <TableHead>{t("email")}</TableHead>
            <TableHead>{t("roleColumn")}</TableHead>
            <TableHead>{t("allowedCalendars")}</TableHead>
            <TableHead>{t("password")}</TableHead>
            <TableHead>{t("registeredAt")}</TableHead>
            <TableHead className="text-right">{tCommon("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <UsersIcon className="h-12 w-12 mb-4 opacity-20" />
                  <p>{t("noUsers")}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            safeUsers.map((user) => {
              // ログインユーザーと同じユーザーかどうかを判定
              const isCurrentUser = session?.user?.email === user.email;

              return (
                <TableRow key={user.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.calendars.length > 0 ? (
                        user.calendars.map((calendar) => (
                          <Badge key={calendar.id} variant="outline" className="text-xs">
                            {calendar.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">{t("none")}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.hasPassword ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        {t("passwordSet")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      >
                        {t("passwordNotSet")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="h-8"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        {t("edit")}
                      </Button>
                      {!user.hasPassword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResetToken(user)}
                          className="h-8"
                        >
                          <KeyRound className="h-4 w-4 mr-1" />
                          {t("resetToken")}
                        </Button>
                      )}
                      {/* 自分自身の削除ボタンは無効化 */}
                      {isCurrentUser ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="h-8 text-destructive hover:text-destructive opacity-50 cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t("delete")}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("cannotDeleteYourself")}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(user)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t("delete")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
