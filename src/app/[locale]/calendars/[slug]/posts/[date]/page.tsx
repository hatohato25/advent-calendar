import { format } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { Calendar, Clock, Tag as TagIcon } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { AuthorInfo } from "@/components/post/AuthorInfo";
import { PostNavigation } from "@/components/post/PostNavigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

// PostContentを動的インポートしてPerformance APIエラーを回避
// WHY: Next.js 16 のコンポーネント計測機能で negative time stamp エラーが発生するため
// react-markdownと複数のrehypeプラグインを使用するPostContentを動的に読み込むことで
// コンポーネントのレンダリングタイミングを調整し、エラーを防ぐ
const PostContent = dynamic(
  () => import("@/components/post/PostContent").then((mod) => ({ default: mod.PostContent })),
  {
    ssr: true,
  },
);

interface PostPageProps {
  params: Promise<{
    locale: string;
    slug: string;
    date: string;
  }>;
}

/**
 * 記事詳細ページ（カレンダー対応版）
 * SSGで全記事を事前生成
 *
 * WHY: カレンダーごとに記事を管理するため、URLにslugを含める
 * WHY: 前後の記事ナビゲーションもカレンダー内でのみ動作
 */
export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug, date } = await params;
  const dateNumber = Number.parseInt(date, 10);

  // 日付フォーマット用のロケール
  const dateLocale = locale === "ja" ? ja : enUS;
  const dateFormat = locale === "ja" ? "yyyy年M月d日" : "MMMM d, yyyy";

  // 日付のバリデーション（1-25の範囲）
  if (Number.isNaN(dateNumber) || dateNumber < 1 || dateNumber > 25) {
    notFound();
  }

  // 第1ステップ: カレンダー取得（公開済みのみ）
  const calendar = await prisma.calendar.findUnique({
    where: {
      slug,
      isPublished: true,
    },
  });

  if (!calendar) {
    notFound();
  }

  // 第2ステップ: 記事と前後の記事を並列取得
  // WHY: article/previousArticle/nextArticleの取得は互いに依存しないため並列化可能
  // WHY: 並列化により500ms〜1秒のレイテンシ削減が期待できる
  const [article, previousArticle, nextArticle] = await Promise.all([
    // 記事を取得（公開済み、該当カレンダーのみ）
    prisma.article.findFirst({
      where: {
        calendarId: calendar.id,
        date: dateNumber,
        status: "published",
      },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    }),
    // 前の記事を取得（同じカレンダー内）
    prisma.article.findFirst({
      where: {
        calendarId: calendar.id,
        date: { lt: dateNumber },
        status: "published",
      },
      orderBy: { date: "desc" },
      select: {
        date: true,
        title: true,
      },
    }),
    // 次の記事を取得（同じカレンダー内）
    prisma.article.findFirst({
      where: {
        calendarId: calendar.id,
        date: { gt: dateNumber },
        status: "published",
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        title: true,
      },
    }),
  ]);

  // 記事が存在しない場合は404
  if (!article) {
    notFound();
  }

  return (
    <>
      {/* ヘッダー（メニュー非表示、カレンダーページに戻るリンク） */}
      <Header showMenu={false} logoLink={`/calendars/${slug}`} />

      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            {/* カレンダー情報 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>
                {calendar.name} -{" "}
                {locale === "ja"
                  ? `${calendar.year}年 12月${article.date}日`
                  : `December ${article.date}, ${calendar.year}`}
              </span>
            </div>

            {/* タイトル */}
            <CardTitle className="text-3xl">{article.title}</CardTitle>

            {/* メタデータ */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pb-4 border-b">
              {/* 投稿者情報 */}
              {article.author && <AuthorInfo author={article.author} size="md" />}

              {/* 公開日時 */}
              {article.publishedAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <time dateTime={article.publishedAt.toISOString()}>
                    {format(new Date(article.publishedAt), dateFormat, { locale: dateLocale })}
                  </time>
                </div>
              )}

              {/* 日付 */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {locale === "ja" ? `12月${article.date}日` : `December ${article.date}`}
                </span>
              </div>
            </div>

            {/* タグ */}
            {article.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: (typeof article.tags)[0]) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* CardDescriptionは削除されたのでここに何もない */}

            {/* Markdownコンテンツ */}
            <PostContent content={article.content} />
          </CardContent>
        </Card>

        {/* ナビゲーション（カレンダー対応） */}
        <div className="mt-8">
          <PostNavigation
            calendarSlug={slug}
            previousArticle={previousArticle || undefined}
            nextArticle={nextArticle || undefined}
          />
        </div>
      </div>
    </>
  );
}

/**
 * SSG用に全記事のパラメータを生成
 * WHY: 公開記事のみをDB側でフィルタリングすることで、不要なデータ転送を削減
 * WHY: 必要なフィールドのみ取得することで、メモリ使用量を削減
 */
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: {
      status: "published",
      calendar: {
        isPublished: true,
      },
    },
    select: {
      date: true,
      calendar: {
        select: {
          slug: true,
        },
      },
    },
  });

  return articles.map((article: (typeof articles)[0]) => ({
    slug: article.calendar.slug,
    date: article.date.toString(),
  }));
}

/**
 * メタデータを動的に生成（SEO/OGP対応）
 */
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug, date } = await params;
  const dateNumber = Number.parseInt(date, 10);

  if (Number.isNaN(dateNumber) || dateNumber < 1 || dateNumber > 25) {
    return {
      title: "記事が見つかりません",
    };
  }

  const calendar = await prisma.calendar.findUnique({
    where: { slug, isPublished: true },
  });

  if (!calendar) {
    return {
      title: "記事が見つかりません",
    };
  }

  const article = await prisma.article.findFirst({
    where: {
      calendarId: calendar.id,
      date: dateNumber,
      status: "published",
    },
    select: {
      title: true,
      content: true,
    },
  });

  if (!article) {
    return {
      title: "記事が見つかりません",
    };
  }

  // 本文の最初の200文字を抜粋
  const description = article.content
    .replace(/[#*`[\]()]/g, "") // Markdown記号を削除
    .substring(0, 200)
    .trim();

  return {
    title: `${article.title} - ${calendar.name}`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
    },
  };
}
