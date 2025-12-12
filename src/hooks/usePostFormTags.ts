import { useState } from "react";

/**
 * usePostFormTags フックの返り値の型
 */
interface UsePostFormTagsReturn {
  /**
   * タグの配列
   */
  tags: string[];
  /**
   * タグ入力欄の値
   */
  tagInput: string;
  /**
   * タグ入力欄の値を更新
   */
  setTagInput: (value: string) => void;
  /**
   * タグ配列を直接設定（EditFormの初期値用）
   */
  setTags: (tags: string[]) => void;
  /**
   * タグを追加（最大10個、重複チェック、トリム処理）
   */
  handleAddTag: () => void;
  /**
   * タグを削除
   */
  handleRemoveTag: (tagToRemove: string) => void;
}

/**
 * PostFormのタグ管理ロジックを抽出したカスタムフック
 *
 * NewPostFormとEditPostFormで共通のタグ管理機能を提供：
 * - タグの追加（最大10個、重複チェック、トリム処理）
 * - タグの削除
 * - タグ入力欄の管理
 *
 * 将来的にAPI経由のタグ管理に変更する場合も、
 * このフック内の実装を変更するだけで済むように設計されている。
 *
 * @param initialTags - 初期タグ配列（EditFormで使用、デフォルトは空配列）
 * @returns タグ管理用の状態とハンドラー
 *
 * @example
 * ```tsx
 * // NewPostForm での使用
 * const { tags, tagInput, setTagInput, handleAddTag, handleRemoveTag } = usePostFormTags();
 *
 * // EditPostForm での使用
 * const { tags, tagInput, setTagInput, setTags, handleAddTag, handleRemoveTag } = usePostFormTags();
 * useEffect(() => {
 *   if (article) {
 *     setTags(article.tags || []);
 *   }
 * }, [article, setTags]);
 * ```
 */
export function usePostFormTags(initialTags: string[] = []): UsePostFormTagsReturn {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags);

  /**
   * タグを追加
   * - トリム処理により前後の空白を削除
   * - 重複チェック：既存のタグと同じ名前は追加しない
   * - 最大10個まで追加可能
   * - 追加後、入力欄をクリア
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  /**
   * タグを削除
   * @param tagToRemove - 削除するタグ
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return {
    tags,
    tagInput,
    setTagInput,
    setTags,
    handleAddTag,
    handleRemoveTag,
  };
}
