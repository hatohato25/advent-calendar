import { PostForm } from "@/components/post/PostForm";

/**
 * NewPostFormコンポーネントのProps
 */
interface NewPostFormProps {
  /**
   * カレンダーのslug
   */
  calendarSlug: string;
  /**
   * 許可された日程の配列（編集者の場合はCalendarPermissionから取得、管理者の場合は1-25）
   */
  allowedDates: number[];
}

/**
 * 記事作成フォームコンポーネント
 * WHY: PostFormコンポーネントに統合し、重複コードを削減
 *
 * Phase 3: PostFormを使用した新規作成フォーム
 */
export function NewPostForm({ calendarSlug, allowedDates }: NewPostFormProps) {
  return <PostForm mode="create" calendarSlug={calendarSlug} allowedDates={allowedDates} />;
}
