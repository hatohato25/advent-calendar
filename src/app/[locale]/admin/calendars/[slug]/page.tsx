import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarSelector } from "@/components/calendar/CalendarSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import {
  canAccessCalendar,
  getAllowedDatesForCalendar,
  getUserAccessibleCalendars,
  requireAuth,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CalendarManagementPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CalendarManagementPageProps): Promise<Metadata> {
  const { slug } = await params;
  const calendar = await prisma.calendar.findUnique({
    where: { slug },
  });

  const t = await getTranslations("calendar.detail");
  const tError = await getTranslations("error.calendar");

  if (!calendar) {
    return {
      title: tError("notFound"),
    };
  }

  return {
    title: `${calendar.name} - ${t("postManagement")}`,
    description: `${calendar.name}${t("postManagement")}`,
  };
}

/**
 * カレンダー別記事一覧ページ（管理画面）
 * 認証済みユーザーが該当カレンダーの記事を管理
 *
 * WHY: カレンダーごとに記事を管理できるようにする
 * WHY: 公開・下書きすべての記事を表示
 * WHY: 編集者は権限のあるカレンダーのみアクセス可能
 */
export default async function CalendarManagementPage({ params }: CalendarManagementPageProps) {
  const { slug } = await params;

  // 認証チェック
  const session = await requireAuth();

  // 翻訳の取得
  const t = await getTranslations("calendar.detail");
  const tStats = await getTranslations("post.statistics");
  const tStatus = await getTranslations("common.status");
  const tPost = await getTranslations("post.list");

  // カレンダー取得
  const calendar = await prisma.calendar.findUnique({
    where: { slug },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!calendar) {
    notFound();
  }

  // 権限チェック
  // WHY: 権限がない場合はエラーではなく、アクセス可能なカレンダーにリダイレクト
  const hasAccess = await canAccessCalendar(session.user.id, calendar.id);
  if (!hasAccess) {
    // アクセス可能なカレンダーを取得
    const accessibleCalendars = await getUserAccessibleCalendars(session.user.id);

    if (accessibleCalendars.length === 0) {
      // アクセス可能なカレンダーがない場合は管理トップにリダイレクト
      redirect("/admin");
    }

    // 最初のアクセス可能なカレンダーにリダイレクト
    redirect(`/admin/calendars/${accessibleCalendars[0].slug}`);
  }

  // カレンダーの記事を取得（公開・下書き含む）
  // WHY: 編集者の場合は許可日程の記事のみ取得
  const allowedDates = await getAllowedDatesForCalendar(session.user.id, calendar.id);

  const articles = await prisma.article.findMany({
    where: {
      calendarId: calendar.id,
      // WHY: 編集者は許可日程の記事のみ表示（adminは全記事）
      ...(allowedDates.length > 0 && allowedDates.length < 25
        ? { date: { in: allowedDates } }
        : {}),
    },
    include: {
      tags: true,
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // 統計情報
  // WHY: 編集者の場合、許可日程を基準にした統計を表示
  const totalAllowedDays = allowedDates.length < 25 ? allowedDates.length : 25;
  const stats = {
    totalArticles: articles.length,
    publishedArticles: articles.filter((a: { status: string }) => a.status === "published").length,
    draftArticles: articles.filter((a: { status: string }) => a.status === "draft").length,
    emptyDays: totalAllowedDays - articles.length,
  };

  // アクセス可能なカレンダーを取得（切り替え用）
  // WHY: 編集者は権限があるカレンダーのみ表示する
  const allCalendars = await getUserAccessibleCalendars(session.user.id);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{calendar.name}</h1>
          <p className="text-muted-foreground mt-1">
            {calendar.year}
            {t("yearSuffix")} - {t("postManagement")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/calendars/${calendar.slug}/posts/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createPost")}
            </Link>
          </Button>
        </div>
      </div>

      {/* カレンダー切り替え */}
      {allCalendars.length > 1 && (
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <CalendarSelector
              calendars={allCalendars}
              currentSlug={slug}
              basePath="/admin/calendars"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* 統計情報カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{tStats("totalArticles")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
            <p className="text-xs text-muted-foreground">
              {tStats("totalArticlesDescription", { count: totalAllowedDays })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{tStats("publishedArticles")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedArticles}</div>
            <p className="text-xs text-muted-foreground">
              {tStats("publishedArticlesDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{tStats("draftArticles")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftArticles}</div>
            <p className="text-xs text-muted-foreground">{tStats("draftArticlesDescription")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{tStats("emptyDays")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emptyDays}</div>
            <p className="text-xs text-muted-foreground">{tStats("emptyDaysDescription")}</p>
          </CardContent>
        </Card>
      </div>

      {/* 記事一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>{tPost("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">{tPost("noArticles")}</p>
              <Button asChild>
                <Link href={`/admin/calendars/${calendar.slug}/posts/new`}>
                  {tPost("createFirst")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        12月{article.date}日
                      </span>
                      <Badge variant={article.status === "published" ? "default" : "secondary"}>
                        {tStatus(article.status)}
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-1">{article.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {article.author && <span>著者: {article.author.username}</span>}
                      <span>
                        更新:{" "}
                        {format(new Date(article.updatedAt), "yyyy/MM/dd", {
                          locale: ja,
                        })}
                      </span>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {article.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {article.status === "published" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/calendars/${calendar.slug}/posts/${article.date}`}>表示</Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/calendars/${calendar.slug}/posts/${article.id}`}>
                        編集
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
