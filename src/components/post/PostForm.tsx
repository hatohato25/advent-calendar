"use client";

import { Download, Eye, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ImportButton } from "@/components/post/ImportButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePostFormTags } from "@/hooks/usePostFormTags";
import { Link, useRouter } from "@/i18n/routing";
import type { ArticleWithTags } from "@/types/article";

// CodeMirrorを動的インポート（SSR無効化）
// エディタはクライアントサイドでのみ動作し、バンドルサイズが大きいため
const MarkdownEditorWithPreview = dynamic(
  () =>
    import("@/components/editor/MarkdownEditorWithPreview").then((mod) => ({
      default: mod.MarkdownEditorWithPreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center border border-border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    ),
  },
);

/**
 * PostFormコンポーネントのProps
 * WHY: 新規作成と編集の両方に対応するため、mode で動作を切り替える
 */
interface PostFormProps {
  /**
   * フォームのモード
   */
  mode: "create" | "edit";
  /**
   * カレンダーのslug
   */
  calendarSlug: string;
  /**
   * 記事のID（編集モード時のみ必須）
   */
  postId?: string;
  /**
   * 許可された日程の配列（編集者の場合はCalendarPermissionから取得、管理者の場合は1-25）
   */
  allowedDates: number[];
}

/**
 * 記事作成・編集フォームコンポーネント
 * WHY: NewPostFormとEditPostFormで重複していた200行以上のコードを統合
 *
 * Phase 2: CodeMirror 6のMarkdownエディタとリアルタイムプレビューを使用
 * - 新規作成: 手動保存のみ
 * - 編集: 自動保存機能付き（コンテンツのみ）
 */
export function PostForm({ mode, calendarSlug, postId, allowedDates }: PostFormProps) {
  const router = useRouter();
  const t = useTranslations("post.form");
  const tEditor = useTranslations("post.editor");
  const tButton = useTranslations("common.button");
  const tLabel = useTranslations("common.label");
  const tStatus = useTranslations("common.status");
  const tDialog = useTranslations("common.dialog");
  const tAction = useTranslations("post.action");
  const tError = useTranslations("error.post");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // フォームの状態
  const [article, setArticle] = useState<ArticleWithTags | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string>("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // タグ管理（カスタムフック）
  const { tags, tagInput, setTagInput, setTags, handleAddTag, handleRemoveTag } = usePostFormTags();

  // 記事データの取得（編集モード時のみ）
  useEffect(() => {
    if (mode === "create") return;

    const fetchArticle = async () => {
      if (!postId) {
        setError(tError("fetchFailed"));
        setIsFetching(false);
        return;
      }

      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error(tError("fetchFailed"));
        }
        const data = await response.json();
        const fetchedArticle = data.article;

        setArticle(fetchedArticle);
        setTitle(fetchedArticle.title);
        setDate(fetchedArticle.date.toString());
        setContent(fetchedArticle.content);
        setTags(fetchedArticle.tags.map((tag: { name: string }) => tag.name));
        setStatus(fetchedArticle.status);
      } catch {
        setError(tError("fetchFailed"));
      } finally {
        setIsFetching(false);
      }
    };

    fetchArticle();
  }, [mode, postId, setTags, tError]);

  // 自動保存機能（編集モード、コンテンツのみ）
  // WHY: タイトル、日付、タグ、ステータスは手動保存とすることで意図しない変更を防ぐ
  const handleAutoSave = useCallback(async () => {
    if (mode === "create" || !article || !postId) return;

    setSaveStatus("saving");

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          status: "draft", // 自動保存は常に下書きとして保存
        }),
      });

      if (!response.ok) {
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
      // 2秒後にsavedステータスをクリア
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, [mode, article, content, postId]);

  // フォーム送信（作成/更新）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const url = mode === "create" ? "/api/posts" : `/api/posts/${postId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const body =
      mode === "create"
        ? {
            title,
            content,
            date: Number.parseInt(date, 10),
            tags,
            status,
            calendarSlug,
          }
        : {
            title,
            content,
            date: Number.parseInt(date, 10),
            tags,
            status,
          };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || (mode === "create" ? tError("createFailed") : tError("updateFailed")),
        );
        setIsLoading(false);
        return;
      }

      // 成功時はカレンダー管理ページにリダイレクト
      router.push(`/admin/calendars/${calendarSlug}`);
      router.refresh();
    } catch {
      setError(mode === "create" ? tError("createError") : tError("updateError"));
      setIsLoading(false);
    }
  };

  // 削除処理（編集モードのみ）
  const handleDelete = async () => {
    if (mode === "create" || !postId) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || tError("deleteFailed"));
        setIsLoading(false);
        return;
      }

      // 成功時はカレンダー管理ページにリダイレクト
      router.push(`/admin/calendars/${calendarSlug}`);
      router.refresh();
    } catch {
      setError(tError("deleteError"));
      setIsLoading(false);
    }
  };

  // エクスポート処理（編集モードのみ）
  const handleExport = async () => {
    if (mode === "create" || !postId) return;

    try {
      const response = await fetch(`/api/posts/${postId}/export`);

      if (!response.ok) {
        setError(tError("exportFailed"));
        return;
      }

      // Blobとしてダウンロード
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Content-Dispositionヘッダーからファイル名を取得
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "article.md";
      if (contentDisposition) {
        const matches = /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i.exec(
          contentDisposition,
        );
        if (matches?.[1]) {
          filename = decodeURIComponent(matches[1]);
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError(tError("exportError"));
    }
  };

  // インポート処理（編集モードのみ）
  // WHY: Markdownファイルから読み込んだデータをフォームに反映
  const handleImport = (data: {
    title: string;
    date: number;
    status: "draft" | "published";
    tags: string[];
    content: string;
  }) => {
    setTitle(data.title);
    setDate(data.date.toString());
    setContent(data.content);
    setTags(data.tags);
    setStatus(data.status);
    setError(""); // エラーをクリア
  };

  // 許可日程が0件の場合
  if (allowedDates.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? tEditor("createNew") : tEditor("editPost")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t("noPermission")}</p>
              <p className="text-sm text-muted-foreground">{t("noPermissionMessage")}</p>
              <div className="mt-6">
                <Button onClick={() => router.push(`/admin/calendars/${calendarSlug}`)}>
                  {t("backToCalendar")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ローディング中（編集モードのみ）
  if (isFetching) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">{tButton("loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 記事が見つからない（編集モードのみ）
  if (mode === "edit" && !article) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-red-600 dark:text-red-400">{t("notFound")}</p>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push(`/admin/calendars/${calendarSlug}`)}>
                {t("backToCalendar")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 現在の日付が許可日程に含まれているかチェック（編集モードのみ）
  const isCurrentDateAllowed =
    mode === "edit" && article ? allowedDates.includes(article.date) : true;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === "create" ? tEditor("createNew") : tEditor("editPost")}
              </CardTitle>
              <CardDescription>
                {mode === "create"
                  ? t("createDescription")
                  : t("editDescription", { date: article?.date || 0 })}
              </CardDescription>
            </div>
            {mode === "edit" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/posts/${postId}/preview`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    {tButton("preview")}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  {tButton("export")}
                </Button>
                <ImportButton onImport={handleImport} disabled={isLoading} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isLoading}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tButton("delete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{tDialog("confirmDelete")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {tAction("confirmDeleteMessage", { title: article?.title || "" })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tButton("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                        {tButton("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 日付が許可されていない場合の警告メッセージ（編集モードのみ） */}
          {mode === "edit" && !isCurrentDateAllowed && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t("noPermissionEdit", { date: article?.date || 0 })}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {t("title")} {t("required")}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
                placeholder={t("titlePlaceholder")}
                maxLength={200}
              />
            </div>

            {/* 日付 */}
            <div className="space-y-2">
              <Label htmlFor="date">
                {t("date")} {t("required")}
              </Label>
              <Select
                value={date}
                onValueChange={setDate}
                disabled={isLoading || (mode === "edit" && !isCurrentDateAllowed)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectDate")} />
                </SelectTrigger>
                <SelectContent>
                  {allowedDates.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {t("dateFormat", { date: day })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "edit" && !isCurrentDateAllowed && (
                <p className="text-sm text-muted-foreground">{t("noPermissionEditMessage")}</p>
              )}
            </div>

            {/* コンテンツ */}
            <div className="space-y-2">
              <Label htmlFor="content">
                {t("content")} {t("required")}
              </Label>
              <div className="h-[600px] border border-border rounded-lg overflow-hidden">
                <MarkdownEditorWithPreview
                  value={content}
                  onChange={setContent}
                  onSave={mode === "edit" ? handleAutoSave : undefined}
                  saveStatus={saveStatus}
                  autoSave={mode === "edit"}
                  autoSaveDelay={2000}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {mode === "edit" ? tEditor("autoSave") : tEditor("manualSave")}
              </p>
            </div>

            {/* タグ */}
            <div className="space-y-2">
              <Label htmlFor="tags">{tLabel("tags")}</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={isLoading || tags.length >= 10}
                  placeholder={t("tagPlaceholder")}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isLoading || tags.length >= 10}
                >
                  {tButton("add")}
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-destructive/20 rounded-full"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{t("tagMax")}</p>
            </div>

            {/* ステータス */}
            <div className="space-y-2">
              <Label>
                {t("status")} {t("required")}
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === "draft"}
                    onChange={(e) => setStatus(e.target.value as "draft")}
                    disabled={isLoading}
                  />
                  <span>{tStatus("draft")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === "published"}
                    onChange={(e) => setStatus(e.target.value as "published")}
                    disabled={isLoading}
                  />
                  <span>{tStatus("published")}</span>
                </label>
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* 送信ボタン */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || !title || !date || !content}>
                {isLoading
                  ? tButton("saving")
                  : mode === "create"
                    ? tButton("save")
                    : tButton("update")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/calendars/${calendarSlug}`)}
                disabled={isLoading}
              >
                {tButton("cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
