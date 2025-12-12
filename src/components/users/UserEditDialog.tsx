"use client";

import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserListItem, UserRole } from "@/types/user";
import { CalendarPermissionsTab } from "./CalendarPermissionsTab";
import { RoleSelector } from "./RoleSelector";
import { TokenDisplay } from "./TokenDisplay";

interface UserEditDialogProps {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserEditDialog({ user, open, onOpenChange, onSuccess }: UserEditDialogProps) {
  const t = useTranslations("admin.users.edit");
  const tButton = useTranslations("common.button");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstLoginUrl, setFirstLoginUrl] = useState<string | null>(null);

  // Form state - 初期値はuserから設定
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState<UserRole>(user?.role || "editor");

  // userが変更されたらフォームの状態を更新
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("updateError"));
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}/reset-token`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("tokenError"));
      }

      setFirstLoginUrl(data.firstLoginUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tokenError"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFirstLoginUrl(null);
    onOpenChange(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {firstLoginUrl ? (
          <div className="space-y-4">
            <TokenDisplay url={firstLoginUrl} messageKey="passwordResetSuccess" />
            <DialogFooter>
              <Button onClick={handleClose}>{tButton("close")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t("tabBasic")}</TabsTrigger>
              <TabsTrigger value="permissions">{t("tabPermissions")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 min-h-[500px] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">{t("usernameLabel")}</Label>
                  <Input
                    id="edit-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_]+"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">{t("emailLabel")}</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <RoleSelector value={role} onChange={setRole} idPrefix="edit-" />

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePasswordReset}
                    disabled={loading}
                  >
                    {t("passwordResetButton")}
                  </Button>
                  <p className="text-xs text-muted-foreground flex-1">{t("passwordResetHelp")}</p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {tButton("cancel")}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? tButton("saving") : tButton("update")}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 min-h-[500px] overflow-y-auto">
              <CalendarPermissionsTab user={user} onSuccess={onSuccess} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
