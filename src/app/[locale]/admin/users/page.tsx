"use client";

import { Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCreateDialog } from "@/components/users/UserCreateDialog";
import { UserEditDialog } from "@/components/users/UserEditDialog";
import { UsersTable } from "@/components/users/UsersTable";
import type { UserListItem } from "@/types/user";

export default function UsersPage() {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const tDialog = useTranslations("common.dialog");
  const locale = useLocale(); // 現在の言語を取得（'ja' または 'en'）
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      // data.usersが存在し、配列であることを確認
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error("Invalid response format:", data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]); // エラー時は空配列を設定
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = async (user: UserListItem) => {
    if (!confirm(tDialog("confirmDeleteWithName", { name: user.username }))) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleResetToken = async (user: UserListItem) => {
    try {
      const response = await fetch(`/api/users/${user.id}/reset-token`, {
        method: "POST",
      });

      const data = await response.json();
      if (response.ok && data.firstLoginUrl) {
        // APIから返されたURLに言語プレフィックスを追加
        // 例: http://localhost:3000/auth/first-login?token=xxx
        //  → http://localhost:3000/ja/auth/first-login?token=xxx
        const url = new URL(data.firstLoginUrl);
        const localizedUrl = `${url.origin}/${locale}${url.pathname}${url.search}`;

        // Clipboard APIが使用可能かチェック
        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(localizedUrl);
            alert(t("table.resetTokenSuccess", { ns: "admin.users" }));
          } catch (clipboardError) {
            // Clipboard APIが失敗した場合のフォールバック
            console.error("Clipboard API failed:", clipboardError);
            showUrlDialog(localizedUrl);
          }
        } else {
          // Clipboard APIが使用できない場合のフォールバック
          showUrlDialog(localizedUrl);
        }
      } else {
        alert(t("table.resetTokenError", { ns: "admin.users" }));
      }
    } catch (error) {
      console.error("Failed to reset token:", error);
      alert(t("table.resetTokenError", { ns: "admin.users" }));
    }
  };

  // Clipboard APIが使用できない場合のフォールバック: URLをプロンプトで表示
  const showUrlDialog = (url: string) => {
    const message = t("table.resetTokenManual", { ns: "admin.users", url });
    // プロンプトで表示し、ユーザーが手動でコピーできるようにする
    prompt(message, url);
  };

  // 統計情報の計算
  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === "admin").length;
  const editorUsers = users.filter((u) => u.role === "editor").length;
  const usersWithoutPassword = users.filter((u) => !u.hasPassword).length;

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
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-2">{t("description")}</p>
          </div>
          <UserCreateDialog onSuccess={fetchUsers} />
        </div>

        {/* 統計情報 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("statistics.totalUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {t("statistics.totalUsersDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("statistics.adminUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
              <p className="text-xs text-muted-foreground">
                {t("statistics.adminUsersDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("statistics.editorUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{editorUsers}</div>
              <p className="text-xs text-muted-foreground">
                {t("statistics.editorUsersDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("statistics.usersWithoutPassword")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersWithoutPassword}</div>
              <p className="text-xs text-muted-foreground">
                {t("statistics.usersWithoutPasswordDescription")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ユーザー一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>{t("table.title")}</CardTitle>
            <CardDescription>{t("table.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onResetToken={handleResetToken}
            />
          </CardContent>
        </Card>
      </div>

      <UserEditDialog
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
