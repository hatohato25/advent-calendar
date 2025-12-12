"use client";

import { Tag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/routing";

interface TagWithCount {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  createdAt: string;
}

/**
 * タグ管理ページ
 * タグの一覧表示、作成、削除機能
 */
export default function TagsPage() {
  const router = useRouter();
  const t = useTranslations("admin.tags");
  const tCommon = useTranslations("common");
  const tCommonTable = useTranslations("common.table");
  const tDialog = useTranslations("common.dialog");
  const tError = useTranslations("error.tag");
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [newTagName, setNewTagName] = useState("");

  // タグ一覧の取得
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (!response.ok) {
          throw new Error(tError("fetchFailed"));
        }
        const data = await response.json();
        setTags(data.tags);
      } catch {
        setError(tError("fetchFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [tError]);

  // タグ一覧の再取得（他の関数から呼び出す用）
  const refetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (!response.ok) {
        throw new Error(tError("fetchFailed"));
      }
      const data = await response.json();
      setTags(data.tags);
    } catch {
      setError(tError("fetchFailed"));
    }
  };

  // タグ作成
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTagName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tError("createFailed"));
        setIsCreating(false);
        return;
      }

      // 成功時はリストを再取得してフォームをリセット
      setNewTagName("");
      await refetchTags();
      router.refresh();
    } catch {
      setError(tError("createError"));
    } finally {
      setIsCreating(false);
    }
  };

  // タグ削除
  const handleDeleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || tError("deleteFailed"));
        return;
      }

      // 成功時はリストを再取得
      await refetchTags();
      router.refresh();
    } catch {
      setError(tError("deleteError"));
    }
  };

  // 未使用タグの一括削除
  const handleDeleteUnusedTags = async () => {
    const unusedTags = tags.filter((tag) => tag.articleCount === 0);

    if (unusedTags.length === 0) {
      setError(tError("noUnused"));
      return;
    }

    try {
      await Promise.all(
        unusedTags.map((tag) =>
          fetch(`/api/tags/${tag.id}`, {
            method: "DELETE",
          }),
        ),
      );

      // 成功時はリストを再取得
      await refetchTags();
      router.refresh();
    } catch {
      setError(tError("deleteUnusedError"));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">{tCommon("button.loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unusedTagCount = tags.filter((tag) => tag.articleCount === 0).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Tag className="h-8 w-8" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-2">{t("description")}</p>
          </div>
        </div>

        {/* タグ作成フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>{t("createNew")}</CardTitle>
            <CardDescription>{t("createDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="tagName" className="sr-only">
                    {t("form.name")}
                  </Label>
                  <Input
                    id="tagName"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder={t("form.namePlaceholder")}
                    disabled={isCreating}
                  />
                </div>
                <Button type="submit" disabled={isCreating || !newTagName.trim()}>
                  {isCreating ? tCommon("button.creating") : tCommon("button.create")}
                </Button>
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* タグ一覧 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("list.title")}</CardTitle>
                <CardDescription>
                  {t("list.description", { total: tags.length, unused: unusedTagCount })}
                </CardDescription>
              </div>
              {unusedTagCount > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      {t("unused.deleteAll")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{tDialog("confirmDelete")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("unused.confirmDeleteMessage", { count: unusedTagCount })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tCommon("button.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteUnusedTags}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {tCommon("button.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("list.empty")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.slug")}</TableHead>
                    <TableHead className="text-center">{t("table.articleCount")}</TableHead>
                    <TableHead className="text-right">{tCommonTable("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <Badge variant="secondary">{tag.name}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {tag.slug}
                      </TableCell>
                      <TableCell className="text-center">{tag.articleCount}</TableCell>
                      <TableCell className="text-right">
                        {tag.articleCount === 0 ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{tDialog("confirmDelete")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("confirmDeleteMessage", { name: tag.name })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{tCommon("button.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {tCommon("button.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t("table.inUse")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
