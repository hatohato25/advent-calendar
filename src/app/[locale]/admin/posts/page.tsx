"use client";

import { ArrowUpDown, FileText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import type { ArticleWithTags } from "@/types/article";

/**
 * 記事一覧ページ（管理画面）
 * ソート、フィルタリング機能付き
 */
export default function PostsListPage() {
  const t = useTranslations("post.list");
  const tFilter = useTranslations("post.filter");
  const tTable = useTranslations("post.table");
  const tCommon = useTranslations("common.table");
  const tStatus = useTranslations("common.status");
  const tButton = useTranslations("common.button");
  const tError = useTranslations("error.post");

  const [articles, setArticles] = useState<ArticleWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // フィルター・ソート状態
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "updatedAt">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 記事データの取得
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts?status=${statusFilter}`);
        if (!response.ok) {
          throw new Error(tError("fetchFailed"));
        }
        const data = await response.json();
        // カレンダー情報を含めて取得
        setArticles(data.articles);
      } catch {
        setError(tError("fetchFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [statusFilter, tError]);

  // ソート処理
  const sortedArticles = [...articles].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      comparison = a.date - b.date;
    } else {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // ソート切り替え
  const toggleSort = (newSortBy: "date" | "updatedAt") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  // 日付のフォーマット
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/calendars">
            <Plus className="mr-2 h-4 w-4" />
            {t("createFromCalendar")}
          </Link>
        </Button>
      </div>

      {/* フィルタ・ソート */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{tFilter("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* ステータスフィルタ */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{tFilter("status")}</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tFilter("statusAll")}</SelectItem>
                  <SelectItem value="published">{tStatus("published")}</SelectItem>
                  <SelectItem value="draft">{tStatus("draft")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ソート */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{tFilter("sortBy")}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort("date")}
                className="flex items-center gap-2"
              >
                {tFilter("sortByDate")}
                {sortBy === "date" && <ArrowUpDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort("updatedAt")}
                className="flex items-center gap-2"
              >
                {tFilter("sortByUpdated")}
                {sortBy === "updatedAt" && <ArrowUpDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 記事テーブル */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{tButton("loading")}</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>{t("empty")}</p>
              <Button asChild className="mt-4">
                <Link href="/admin/calendars">{t("createFromCalendar")}</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">{tTable("calendar")}</TableHead>
                  <TableHead className="w-[100px]">{tTable("date")}</TableHead>
                  <TableHead>{tTable("title")}</TableHead>
                  <TableHead className="w-[100px]">{tTable("status")}</TableHead>
                  <TableHead>{tTable("tags")}</TableHead>
                  <TableHead className="w-[200px]">{tTable("updatedAt")}</TableHead>
                  <TableHead className="w-[100px]">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {article.calendar?.name || tTable("unknown")}
                    </TableCell>
                    <TableCell className="font-medium">12月{article.date}日</TableCell>
                    <TableCell>
                      <Link
                        href={
                          article.calendar?.slug
                            ? `/admin/calendars/${article.calendar.slug}/posts/${article.id}`
                            : "#"
                        }
                        className="hover:underline font-medium"
                      >
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={article.status === "published" ? "default" : "secondary"}>
                        {tStatus(article.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag: (typeof article.tags)[0]) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{article.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(article.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={
                            article.calendar?.slug
                              ? `/admin/calendars/${article.calendar.slug}/posts/${article.id}`
                              : "#"
                          }
                        >
                          {tButton("edit")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
