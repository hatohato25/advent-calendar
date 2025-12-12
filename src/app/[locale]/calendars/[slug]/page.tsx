import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarGridClient } from "@/components/calendar/CalendarGridClient";
import { CalendarSelector } from "@/components/calendar/CalendarSelector";
import { Header } from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import type { ArticleListItem, TagSimple } from "@/types";

interface CalendarPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CalendarPageProps): Promise<Metadata> {
  const { slug } = await params;
  const calendar = await prisma.calendar.findUnique({
    where: { slug },
  });

  if (!calendar) {
    return {
      title: "カレンダーが見つかりません",
    };
  }

  return {
    title: `${calendar.name} - アドベントカレンダー`,
    description: calendar.description || `${calendar.name} - 12月1日から25日まで毎日記事を公開`,
    openGraph: {
      title: calendar.name,
      description: calendar.description || `${calendar.name} - 12月1日から25日まで毎日記事を公開`,
      type: "website",
    },
  };
}

// ISR設定: 60秒ごとに再検証
export const revalidate = 60;

/**
 * 公開カレンダーページ
 * slugで指定されたカレンダーの記事一覧を表示
 *
 * WHY: 複数カレンダー対応により、各カレンダーごとのページが必要
 * WHY: 公開カレンダーのみを表示（非公開は404）
 * WHY: ISRで高速なページ表示を実現
 */
export default async function CalendarPage({ params }: CalendarPageProps) {
  const { slug } = await params;

  // カレンダー取得（公開済みのみ）
  const calendar = await prisma.calendar.findUnique({
    where: {
      slug,
      isPublished: true,
    },
  });

  if (!calendar) {
    notFound();
  }

  // カレンダーの記事を取得（公開済みのみ）
  const articles = await prisma.article.findMany({
    where: {
      calendarId: calendar.id,
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
    orderBy: {
      date: "asc",
    },
  });

  // 型変換
  const articleList: ArticleListItem[] = articles.map((article: (typeof articles)[0]) => ({
    id: article.id,
    title: article.title,
    date: article.date,
    status: article.status as "draft" | "published",
    tags: article.tags.map((tag: (typeof article.tags)[0]) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
    author: article.author
      ? {
          id: article.author.id,
          username: article.author.username,
          email: article.author.email,
          displayName: article.author.displayName,
          avatarUrl: article.author.avatarUrl,
        }
      : undefined,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  }));

  // すべてのタグを取得（フィルタ用）
  const tags = await prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const tagList: TagSimple[] = tags.map((tag: (typeof tags)[0]) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));

  // 公開中の全カレンダーを取得（切り替え用）
  const allCalendars = await prisma.calendar.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      year: "desc",
    },
  });

  return (
    <>
      {/* ヘッダー（メニュー非表示） */}
      <Header showMenu={false} />

      <div className="container mx-auto py-8">
        {/* カレンダー情報 */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{calendar.name}</h1>
          {calendar.description && (
            <p className="text-lg text-muted-foreground mb-4">{calendar.description}</p>
          )}
          {calendar.theme && (
            <p className="text-sm text-muted-foreground">テーマ: {calendar.theme}</p>
          )}
        </div>

        {/* カレンダー切り替え */}
        {allCalendars.length > 1 && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-xs">
              <CalendarSelector calendars={allCalendars} currentSlug={slug} className="w-full" />
            </div>
          </div>
        )}

        {/* カレンダーグリッド */}
        <Suspense fallback={<div className="text-center py-12">読み込み中...</div>}>
          <CalendarGridClient articles={articleList} availableTags={tagList} calendarSlug={slug} />
        </Suspense>
      </div>
    </>
  );
}
