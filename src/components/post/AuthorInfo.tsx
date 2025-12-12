"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatar";
import { getDisplayName } from "@/lib/utils/author";

/**
 * 投稿者情報表示コンポーネント
 * アバター画像と表示名を表示する共通コンポーネント
 *
 * WHY: カレンダーグリッド、記事詳細ページの両方で投稿者情報を統一的に表示するため
 * WHY: サイズのバリエーションを提供し、各コンテキストに適したサイズで表示できるようにする
 */

interface AuthorInfoProps {
  author: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-6 h-6", // 24px - カレンダーグリッド用
  md: "w-12 h-12", // 48px - 記事詳細ページ用
  lg: "w-16 h-16", // 64px - 将来の拡張用
};

const pixelSizeMap = {
  sm: 64,
  md: 128,
  lg: 256,
};

export function AuthorInfo({
  author,
  size = "md",
  showName = true,
  className = "",
}: AuthorInfoProps) {
  const displayName = getDisplayName(author);
  const avatarUrl = getAvatarUrl(author, pixelSizeMap[size]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={sizeMap[size]}>
        <AvatarImage src={avatarUrl} alt={displayName} loading="lazy" />
        <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {showName && <span className="text-sm font-medium">{displayName}</span>}
    </div>
  );
}
