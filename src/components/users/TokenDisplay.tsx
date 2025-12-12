"use client";

/**
 * 初回ログインURLを表示するコンポーネント
 *
 * WHY: UserCreateDialog と UserEditDialog で重複していたトークン表示UIを共通化
 * コピーボタンと成功メッセージの表示を含む
 */

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTokenCopy } from "@/hooks/useTokenCopy";

interface TokenDisplayProps {
  /**
   * 初回ログインURL
   * WHY: nullの場合はコンポーネントを表示しない
   */
  url: string | null;

  /**
   * 成功メッセージのキー
   * WHY: UserCreateDialogとUserEditDialogで異なるメッセージを表示するため
   */
  messageKey: "successMessage" | "passwordResetSuccess";
}

export function TokenDisplay({ url, messageKey }: TokenDisplayProps) {
  const t = useTranslations("admin.users.create");
  const tEdit = useTranslations("admin.users.edit");
  const { copied, copyToClipboard } = useTokenCopy();

  if (!url) return null;

  const handleCopy = () => {
    copyToClipboard(url);
  };

  // WHY: メッセージキーに応じて適切な翻訳を選択
  const message = messageKey === "successMessage" ? t(messageKey) : tEdit(messageKey);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex gap-2">
        <Input value={url} readOnly className="flex-1" />
        <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
