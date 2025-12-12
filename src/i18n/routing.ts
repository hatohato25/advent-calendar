import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // サポートする言語
  locales: ["ja", "en"],

  // デフォルト言語
  defaultLocale: "ja",

  // 言語プレフィックスを常に表示（/ja/..., /en/...）
  localePrefix: "always",
});

// 型安全なナビゲーション関数をエクスポート
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
