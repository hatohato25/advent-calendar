/**
 * 統一されたエラーメッセージ表示コンポーネント
 *
 * WHY: プロジェクト全体で一貫したエラー表示スタイルを提供
 * 各ページで個別にスタイルを定義する重複を削減
 */

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
      {message}
    </div>
  );
}
