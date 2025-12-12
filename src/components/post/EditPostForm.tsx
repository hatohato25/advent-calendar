import { PostForm } from "@/components/post/PostForm";

/**
 * EditPostFormコンポーネントのProps
 */
interface EditPostFormProps {
  /**
   * カレンダーのslug
   */
  calendarSlug: string;
  /**
   * 記事のID
   */
  postId: string;
  /**
   * 許可された日程の配列（編集者の場合はCalendarPermissionから取得、管理者の場合は1-25）
   */
  allowedDates: number[];
}

/**
 * 記事編集フォームコンポーネント
 * WHY: PostFormコンポーネントに統合し、重複コードを削減
 *
 * Phase 3: PostFormを使用した編集フォーム
 */
export function EditPostForm({ calendarSlug, postId, allowedDates }: EditPostFormProps) {
  return (
    <PostForm mode="edit" calendarSlug={calendarSlug} postId={postId} allowedDates={allowedDates} />
  );
}
