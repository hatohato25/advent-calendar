import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PostPageProps {
  params: Promise<{
    date: string;
  }>;
}

/**
 * 記事詳細ページ（レガシーURL）
 * 既存URLとの後方互換性のため、新URLにリダイレクト
 *
 * WHY: 既存の /posts/:date URLを維持し、SEOとブックマーク対策
 * WHY: 該当する記事を含むカレンダーの新URLにリダイレクト
 */
export default async function PostPage({ params }: PostPageProps) {
  const { date } = await params;
  const dateNumber = Number.parseInt(date, 10);

  // 日付のバリデーション（1-25の範囲）
  if (Number.isNaN(dateNumber) || dateNumber < 1 || dateNumber > 25) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">記事が見つかりません</h1>
        <p className="text-muted-foreground">指定された日付の記事は存在しません</p>
      </div>
    );
  }

  // 記事を取得（公開済みのみ）
  const article = await prisma.article.findFirst({
    where: {
      date: dateNumber,
      status: "published",
    },
    include: {
      calendar: {
        select: {
          slug: true,
          isPublished: true,
        },
      },
    },
  });

  // 記事が存在しない場合
  if (!article) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">記事が見つかりません</h1>
        <p className="text-muted-foreground">12月{dateNumber}日の記事はまだ公開されていません</p>
      </div>
    );
  }

  // 公開カレンダーの記事のみリダイレクト
  if (article.calendar.isPublished) {
    redirect(`/calendars/${article.calendar.slug}/posts/${dateNumber}`);
  }

  // 非公開カレンダーの記事は表示しない
  return (
    <div className="container mx-auto py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">記事が見つかりません</h1>
      <p className="text-muted-foreground">この記事は現在非公開です</p>
    </div>
  );
}
