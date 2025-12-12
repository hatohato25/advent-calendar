"use client";

import { useEffect, useState } from "react";
import { PostContent } from "@/components/post/PostContent";

interface MarkdownPreviewProps {
  content: string;
  debounceMs?: number;
}

export function MarkdownPreview({ content, debounceMs = 500 }: MarkdownPreviewProps) {
  const [debouncedContent, setDebouncedContent] = useState(content);

  // デバウンス処理（プレビュー更新の遅延）
  // ユーザーが入力を止めてからdebounceMs後にプレビューを更新
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, debounceMs]);

  return (
    <div className="h-full w-full overflow-auto p-6 prose prose-zinc dark:prose-invert max-w-none">
      {debouncedContent ? (
        <PostContent content={debouncedContent} />
      ) : (
        <p className="text-muted-foreground text-sm">プレビューが表示されます</p>
      )}
    </div>
  );
}
