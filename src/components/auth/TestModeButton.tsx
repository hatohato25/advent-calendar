"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * テストモード開始ボタン
 *
 * ユーザー登録なしにサービスを即時体験させるための機能。
 * 確認ダイアログで注意事項を提示した後、テストユーザーを自動生成して管理画面にリダイレクトする。
 * テストユーザーは6時間後に自動削除される。
 */
export function TestModeButton() {
  const t = useTranslations("auth.testMode");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTestMode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // テストユーザーを作成
      const response = await fetch("/api/auth/test-mode", { method: "POST" });

      if (!response.ok) {
        throw new Error("テストユーザーの作成に失敗しました");
      }

      const data = (await response.json()) as { testUserId: string };

      if (!data.testUserId) {
        throw new Error("テストユーザーIDが取得できませんでした");
      }

      // テストユーザーIDでログイン（NextAuth.js の credentials プロバイダーを使用）
      await signIn("credentials", {
        testUserId: data.testUserId,
        redirect: true,
        callbackUrl: `/${locale}/admin`,
      });
    } catch {
      setError(t("errorFailed"));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {error}
        </div>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full" disabled={isLoading}>
            {isLoading ? "開始中..." : t("buttonLabel")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {t("dialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelButton")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartTestMode} disabled={isLoading}>
              {t("confirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
