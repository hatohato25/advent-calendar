"use client";

/**
 * トークンコピー機能を提供するカスタムフック
 *
 * WHY: UserCreateDialogとUserEditDialogで重複していたトークンコピー機能を共通化
 * クリップボードAPIの呼び出しとコピー完了状態の管理をカプセル化
 */

import { useCallback, useState } from "react";

interface UseTokenCopyReturn {
  /**
   * コピーが完了したかどうかの状態
   * WHY: チェックマークアイコンの表示制御に使用
   */
  copied: boolean;

  /**
   * テキストをクリップボードにコピーする関数
   * WHY: 2秒間だけcopied状態をtrueにすることでユーザーにフィードバックを提供
   */
  copyToClipboard: (text: string) => Promise<void>;
}

export function useTokenCopy(): UseTokenCopyReturn {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // WHY: 2秒後に自動的にcopied状態をリセットして元のアイコンに戻す
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  return { copied, copyToClipboard };
}
