"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

export function CalendarCreateDialog({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("calendar.new");
  const tForm = useTranslations("calendar.form");
  const tButton = useTranslations("common.button");
  const tLabel = useTranslations("common.label");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          year,
          slug,
          description: description || undefined,
          theme: theme || undefined,
          isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "カレンダーの作成に失敗しました");
      }

      // 成功時はフォームをリセットしてダイアログを閉じる
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "カレンダーの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // フォームのリセット
    setName("");
    setYear(new Date().getFullYear());
    setSlug("");
    setDescription("");
    setTheme("");
    setIsPublished(false);
    setError(null);
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カレンダー名 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {tForm("name")} {tLabel("required")}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tForm("namePlaceholder")}
              required
            />
            <p className="text-xs text-muted-foreground">{tForm("nameDescription")}</p>
          </div>

          {/* 年度 */}
          <div className="space-y-2">
            <Label htmlFor="year">
              {tForm("year")} {tLabel("required")}
            </Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              placeholder={tForm("yearPlaceholder")}
              required
            />
            <p className="text-xs text-muted-foreground">{tForm("yearDescription")}</p>
          </div>

          {/* スラッグ */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              {tForm("slug")} {tLabel("required")}
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={tForm("slugPlaceholder")}
              pattern="[a-z0-9\-]+"
              required
            />
            <p className="text-xs text-muted-foreground">
              {tForm("slugDescription")}
              <br />
              {tForm("slugDescriptionDetail")}
            </p>
          </div>

          {/* 説明文 */}
          <div className="space-y-2">
            <Label htmlFor="description">{tForm("description")}</Label>
            <Textarea
              id="description"
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
            <Label htmlFor="theme">{tForm("theme")}</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder={tForm("themePlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{tForm("themeDescription")}</p>
          </div>

          {/* 公開状態 */}
          <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <Checkbox
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="isPublished" className="cursor-pointer">
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
              {loading ? tButton("creating") : tButton("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
