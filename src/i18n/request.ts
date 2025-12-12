import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as "ja" | "en")) {
    notFound();
  }

  return {
    locale,
    // 翻訳ファイルを動的にインポート
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
