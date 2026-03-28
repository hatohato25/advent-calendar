"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

/**
 * テストモードバナー
 *
 * テストモードユーザーが管理画面を操作中であることを常時通知する。
 * 通常ユーザーのログイン中は表示されない。
 */
export function TestModeBanner() {
  const t = useTranslations("auth.testMode");
  const { data: session } = useSession();

  // テストユーザーでない場合は何も表示しない
  if (!session?.user?.isTestUser) {
    return null;
  }

  return (
    <div className="border-b border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900 px-4 py-2">
      <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
        {t("bannerMessage")}
      </p>
    </div>
  );
}
