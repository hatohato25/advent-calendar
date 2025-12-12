import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { EditPostForm } from "@/components/post/EditPostForm";
import { getAllowedDatesForCalendar, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 記事編集ページ
 * サーバーコンポーネントで許可日程を取得し、EditPostFormに渡す
 */
export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  // 認証チェック
  let session: Session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/auth/signin");
  }

  // paramsを解決
  const { slug, id } = await params;

  // カレンダーを取得
  const calendar = await prisma.calendar.findUnique({
    where: { slug },
  });

  if (!calendar) {
    redirect("/admin");
  }

  // 許可日程を取得
  const allowedDates = await getAllowedDatesForCalendar(session.user.id, calendar.id);

  return <EditPostForm calendarSlug={slug} postId={id} allowedDates={allowedDates} />;
}
