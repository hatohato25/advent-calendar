"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/types/user";
import { RoleSelector } from "./RoleSelector";
import { TokenDisplay } from "./TokenDisplay";

export function UserCreateDialog({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("admin.users.create");
  const tButton = useTranslations("common.button");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstLoginUrl, setFirstLoginUrl] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("editor");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("createError"));
      }

      setFirstLoginUrl(data.firstLoginUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setRole("editor");
    setError(null);
    setFirstLoginUrl(null);
    if (firstLoginUrl) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {firstLoginUrl ? (
          <div className="space-y-4">
            <TokenDisplay url={firstLoginUrl} messageKey="successMessage" />
            <DialogFooter>
              <Button onClick={handleClose}>{tButton("close")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">{t("emailHelp")}</p>
            </div>

            <RoleSelector value={role} onChange={setRole} idPrefix="create-" />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                {tButton("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? tButton("creating") : tButton("create")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
