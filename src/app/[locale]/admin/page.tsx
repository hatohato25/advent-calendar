import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, FileText, PenSquare, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminCalendarSelector } from "@/components/admin/AdminCalendarSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getAllowedDatesForCalendar, getUserAccessibleCalendars, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AdminDashboardPageProps {
  searchParams: Promise<{ calendar?: string }>;
}

/**
 * 管理ダッシュボードページ（ハイブリッド方式）
 *
 * WHY: adminユーザーは全カレンダー横断の統計を表示し、カレンダーを切り替えられる
 * WHY: editorユーザーは許可されている最新カレンダーの個別ページにリダイレクト
 */
export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  // 認証チェック
  const session = await requireAuth();
  const params = await searchParams;
  const t = await getTranslations("calendar.detail");
  const tPost = await getTranslations("post");
  const tStats = await getTranslations("post.statistics");
  const tStatus = await getTranslations("common.status");

  // editorユーザーの場合、許可されているカレンダーにリダイレクト
  if (session.user.role === "editor") {
    const accessibleCalendars = await getUserAccessibleCalendars(session.user.id);

    if (accessibleCalendars.length === 0) {
      // エラーをスローするのではなく、適切なメッセージを表示するページを返す
      return (
        <div className="container mx-auto py-16 px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("noAccess")}
              </CardTitle>
              <CardDescription>{t("noAccessDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("noAccessMessage")}
                  <br />
                  {t("noAccessMessageDetail")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/">{t("backToTop")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // 最新年度のカレンダーにリダイレクト
    redirect(`/admin/calendars/${accessibleCalendars[0].slug}`);
  }

  // adminユーザーの処理
  // アクセス可能な全カレンダーを取得
  const allCalendars = await prisma.calendar.findMany({
    orderBy: { year: "desc" },
  });

  // 選択されたカレンダーを決定（デフォルトは最新年度）
  const selectedSlug = params.calendar || allCalendars[0]?.slug;
  const selectedCalendar = allCalendars.find((c) => c.slug === selectedSlug) || allCalendars[0];

  if (!selectedCalendar) {
    throw new Error("カレンダーが見つかりません");
  }

  // 選択されたカレンダーの記事を取得
  // WHY: この時点ではadminのみだが、将来editorもこのページにアクセスする可能性を考慮
  const allowedDates = await getAllowedDatesForCalendar(session.user.id, selectedCalendar.id);

  const articles = await prisma.article.findMany({
    where: {
      calendarId: selectedCalendar.id,
      // WHY: 将来editorもこのページにアクセスする可能性を考慮し、許可日程でフィルタリング
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
      updatedAt: "desc",
    },
  });

  // 統計情報
  // WHY: 許可日程が25日未満の場合（将来のeditor対応）、許可日程を基準にした統計を表示
  const totalAllowedDays = allowedDates.length < 25 ? allowedDates.length : 25;
  const stats = {
    totalArticles: articles.length,
    publishedArticles: articles.filter((a) => a.status === "published").length,
    draftArticles: articles.filter((a) => a.status === "draft").length,
    emptyDays: totalAllowedDays - articles.length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {t("postManagement")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {selectedCalendar.name} ({selectedCalendar.year}
            {t("yearSuffix")})
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/calendars/${selectedCalendar.slug}/posts/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createPost")}
            </Link>
          </Button>
        </div>
      </div>

      {/* カレンダー切り替え */}
      {allCalendars.length > 1 && (
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-xs">
            <AdminCalendarSelector calendars={allCalendars} currentSlug={selectedSlug} />
          </div>
        </div>
      )}

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats("totalArticles")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
            <p className="text-xs text-muted-foreground">
              {tStats("totalArticlesDescription", { count: totalAllowedDays })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats("publishedArticles")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedArticles}</div>
            <p className="text-xs text-muted-foreground">
              {tStats("publishedArticlesDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats("draftArticles")}</CardTitle>
            <PenSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftArticles}</div>
            <p className="text-xs text-muted-foreground">{tStats("draftArticlesDescription")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats("emptyDays")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{tPost("list.recentUpdates")}</CardTitle>
              <CardDescription>{tPost("list.recentUpdatesDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>{tPost("list.noArticles")}</p>
              <Button asChild className="mt-4">
                <Link href={`/admin/calendars/${selectedCalendar.slug}/posts/new`}>
                  {tPost("list.createFirst")}
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
                        {tPost("form.dateFormat", { date: article.date })}
                      </span>
                      <Badge variant={article.status === "published" ? "default" : "secondary"}>
                        {tStatus(article.status)}
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-1">{article.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {article.author && (
                        <span>
                          {tPost("detail.author")} {article.author.username}
                        </span>
                      )}
                      <span>
                        {tPost("detail.updated")}:{" "}
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
                        <Link href={`/calendars/${selectedCalendar.slug}/posts/${article.date}`}>
                          {tPost("detail.view")}
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/calendars/${selectedCalendar.slug}/posts/${article.id}`}>
                        {tPost("editor.editPost")}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* カレンダービューへのリンク */}
      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href={`/calendars/${selectedCalendar.slug}`}>
            <Calendar className="mr-2 h-4 w-4" />
            {tPost("detail.viewCalendar")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
