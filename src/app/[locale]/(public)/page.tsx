import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

/**
 * トップページ
 * 最新のアクティブなカレンダーにリダイレクト
 *
 * WHY: 複数カレンダー対応により、トップページは最新カレンダーへのリダイレクトに変更
 * WHY: カレンダーが存在しない場合は、カレンダー不在ページを表示
 */
export default async function HomePage() {
  const t = await getTranslations("calendar");

  // 最新の公開カレンダーを取得
  const latestCalendar = await prisma.calendar.findFirst({
    where: {
      isPublished: true,
    },
    orderBy: {
      year: "desc",
    },
    select: {
      slug: true,
    },
  });

  // カレンダーが存在する場合はそのカレンダーページへリダイレクト
  if (latestCalendar) {
    // Server Componentでは通常のredirectを使用（ミドルウェアが言語パスを追加）
    redirect(`/calendars/${latestCalendar.slug}`);
  }

  // カレンダーが存在しない場合はメッセージを表示
  return (
    <div className="container mx-auto py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
      <p className="text-lg text-muted-foreground mb-8">{t("grid.noCalendar")}</p>
      <p className="text-sm text-muted-foreground">{t("grid.waitForCalendar")}</p>
    </div>
  );
}
