import { cn } from "@/lib/utils";

/**
 * スピナーコンポーネント
 *
 * WHY: ローディング状態を統一されたUIで表示し、保守性を向上させるため
 */

export interface SpinnerProps {
  /** スピナーのサイズ */
  size?: "sm" | "md" | "lg";
  /** 追加のCSSクラス */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
} as const;

/**
 * Spinner
 *
 * @param size - スピナーのサイズ（sm, md, lg）デフォルトはsm
 * @param className - 追加のCSSクラス
 */
export function Spinner({ size = "sm", className }: SpinnerProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: スピナーは装飾的な要素なのでspanが適切
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="読み込み中"
    />
  );
}
