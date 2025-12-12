import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { NewPostForm } from "@/components/post/NewPostForm";
import { getAllowedDatesForCalendar, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 記事作成ページ
 * サーバーコンポーネントで許可日程を取得し、NewPostFormに渡す
 */
export default async function NewPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // 認証チェック
  let session: Session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/auth/signin");
  }

  // paramsを解決
  const { slug } = await params;

  // カレンダーを取得
  const calendar = await prisma.calendar.findUnique({
    where: { slug },
  });

  if (!calendar) {
    redirect("/admin");
  }

  // 許可日程を取得
  const allowedDates = await getAllowedDatesForCalendar(session.user.id, calendar.id);

  return <NewPostForm calendarSlug={slug} allowedDates={allowedDates} />;
}
