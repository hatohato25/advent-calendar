"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import type { CalendarWithStats } from "@/types/calendar";

interface CalendarEditDialogProps {
  calendar: CalendarWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CalendarEditDialog({
  calendar,
  open,
  onOpenChange,
  onSuccess,
}: CalendarEditDialogProps) {
  const t = useTranslations("calendar.edit");
  const tForm = useTranslations("calendar.form");
  const tButton = useTranslations("common.button");
  const tLabel = useTranslations("common.label");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - 初期値はcalendarから設定
  const [name, setName] = useState(calendar?.name || "");
  const [description, setDescription] = useState(calendar?.description || "");
  const [theme, setTheme] = useState(calendar?.theme || "");
  const [isPublished, setIsPublished] = useState(calendar?.isPublished || false);

  // calendarが変更されたらフォームの状態を更新
  useEffect(() => {
    if (calendar) {
      setName(calendar.name);
      setDescription(calendar.description || "");
      setTheme(calendar.theme || "");
      setIsPublished(calendar.isPublished);
    }
  }, [calendar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendar) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendars/${calendar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          theme: theme || undefined,
          isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "カレンダーの更新に失敗しました");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "カレンダーの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  if (!calendar) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {calendar.name} ({calendar.year})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カレンダー名 */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              {tForm("name")} {tLabel("required")}
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tForm("namePlaceholder")}
              required
            />
            <p className="text-xs text-muted-foreground">{tForm("nameDescription")}</p>
          </div>

          {/* 年度（読み取り専用） */}
          <div className="space-y-2">
            <Label htmlFor="edit-year">{tForm("year")}</Label>
            <Input id="edit-year" value={calendar.year} disabled />
            <p className="text-xs text-muted-foreground">{tForm("yearDescription")}</p>
          </div>

          {/* スラッグ（読み取り専用） */}
          <div className="space-y-2">
            <Label htmlFor="edit-slug">{tForm("slug")}</Label>
            <Input id="edit-slug" value={calendar.slug} disabled />
            <p className="text-xs text-muted-foreground">
              {tForm("slugDescription")}
              <br />
              {tForm("slugDescriptionDetail")}
            </p>
          </div>

          {/* 説明文 */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">{tForm("description")}</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tForm("descriptionPlaceholder")}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{tForm("descriptionDescription")}</p>
          </div>

          {/* テーマ */}
          <div className="space-y-2">
            <Label htmlFor="edit-theme">{tForm("theme")}</Label>
            <Input
              id="edit-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder={tForm("themePlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{tForm("themeDescription")}</p>
          </div>

          {/* 公開状態 */}
          <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <Checkbox
              id="edit-isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="edit-isPublished" className="cursor-pointer">
                {tForm("isPublishedLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">{tForm("isPublishedDescription")}</p>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {tButton("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tButton("saving") : tButton("update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
