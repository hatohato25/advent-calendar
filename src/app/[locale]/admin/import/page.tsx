"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/routing";

/**
 * 記事インポートページ
 * Markdownファイルをアップロードして記事を作成/更新
 */
export default function ImportPage() {
  const router = useRouter();
  const t = useTranslations("admin.import");
  const tCommon = useTranslations("common");
  const tError = useTranslations("error");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [overwrite, setOverwrite] = useState(false);

  // ファイルアップロード処理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMarkdown(content);
    };
    reader.readAsText(file);
  };

  // インポート処理
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/posts/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markdown,
          overwrite,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tError("post.createFailed"));
        setIsLoading(false);
        return;
      }

      setSuccess(data.message || tCommon("success.imported"));
      setMarkdown("");

      // 3秒後にダッシュボードにリダイレクト
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 3000);
    } catch {
      setError(tError("post.createError"));
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="space-y-6">
            {/* ファイルアップロード */}
            <div className="space-y-2">
              <Label htmlFor="file">{t("fileLabel")}</Label>
              <input
                id="file"
                type="file"
                accept=".md,.markdown"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border file:border-input
                  file:text-sm file:font-medium
                  file:bg-background hover:file:bg-accent
                  file:cursor-pointer cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">{t("fileDescription")}</p>
            </div>

            {/* Markdownプレビュー */}
            <div className="space-y-2">
              <Label htmlFor="markdown">{t("previewLabel")}</Label>
              <Textarea
                id="markdown"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                disabled={isLoading}
                placeholder="---
title: 記事タイトル
date: 1
status: draft
tags:
  - タグ1
  - タグ2
---

# 記事本文

ここに記事の内容を書きます。"
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            {/* 上書きオプション */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="overwrite" className="text-sm font-normal cursor-pointer">
                {t("overwriteLabel")}
              </Label>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* 成功メッセージ */}
            {success && (
              <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                {success}
                <br />
                <span className="text-xs">{t("successRedirect")}</span>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || !markdown}>
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? tCommon("button.loading") : tCommon("button.import")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {tCommon("button.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 使用方法 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("frontmatter.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("frontmatter.description")}</p>
          <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
            {`---
title: ${t("frontmatter.titleField")}（${t("frontmatter.titleRequired")}）
date: 1（${t("frontmatter.dateRange")}、${t("frontmatter.titleRequired")}）
status: ${t("frontmatter.statusOptions")}
tags:
  - TypeScript
  - Next.js
---

# 記事本文

ここに記事の内容をMarkdown形式で書きます。`}
          </pre>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong>title</strong>: {t("frontmatter.titleField")}（
              {t("frontmatter.titleRequired")}）
            </li>
            <li>
              <strong>date</strong>: {t("frontmatter.dateField")}（{t("frontmatter.dateRange")}、
              {t("frontmatter.titleRequired")}）
            </li>
            <li>
              <strong>status</strong>: {t("frontmatter.statusField")}（
              {t("frontmatter.statusOptions")}）
            </li>
            <li>
              <strong>tags</strong>: {t("frontmatter.tagsField")}（{t("frontmatter.tagsOptional")}）
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
