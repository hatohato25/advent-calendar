import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Tag as TagIcon, User } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PostContent } from "@/components/post/PostContent";
import { CloseButton } from "@/components/preview/CloseButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canAccessCalendar, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 管理画面用記事プレビューページ
 * 下書き記事もプレビュー可能
 * WHY: 編集画面からプレビューボタンで開くページ
 * WHY: 認証必須で、カレンダーへのアクセス権限がある記事のみ表示可能
 */
export default async function AdminPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  // 認証チェック
  const session = await requireAuth();
  const { id } = await params;
  const t = await getTranslations("post.preview");
  const tStatus = await getTranslations("common.status");
  const tPost = await getTranslations("post.detail");

  // 記事を取得
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      tags: true,
      author: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      calendar: {
        select: {
          id: true,
          name: true,
          slug: true,
          year: true,
        },
      },
    },
  });

  if (!article) {
    notFound();
  }

  // 権限チェック: カレンダーへのアクセス権限
  const hasAccess = await canAccessCalendar(session.user.id, article.calendar.id);
  if (!hasAccess) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">
                {article.status === "draft" && (
                  <Badge variant="secondary" className="mr-2">
                    {tStatus("draft")}
                  </Badge>
                )}
                {t("description")}
              </p>
            </div>
            <CloseButton />
          </div>
        </div>
      </header>

      {/* 記事コンテンツ */}
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>
                {article.calendar.name} - {article.calendar.year}年 12月{article.date}日
              </span>
            </div>
            <CardTitle className="text-3xl">{article.title}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-4">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {article.author.username}
              </span>
              {article.publishedAt && (
                <span>
                  {tPost("published")}:{" "}
                  {format(new Date(article.publishedAt), "yyyy年M月d日", { locale: ja })}
                </span>
              )}
              <span>
                {tPost("updated")}:{" "}
                {format(new Date(article.updatedAt), "yyyy年M月d日", { locale: ja })}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* タグ */}
            {article.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Markdownコンテンツ */}
            <PostContent content={article.content} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
