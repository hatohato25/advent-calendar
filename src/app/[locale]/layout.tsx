import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SessionProvider } from "@/components/theme/SessionProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// メタデータを生成（言語ごとに動的に変更）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ja" ? "アドベントカレンダー 2025" : "Advent Calendar 2025",
    description:
      locale === "ja"
        ? "エンジニア向けアドベントカレンダー - 12月1日から25日まで毎日記事を公開"
        : "Advent Calendar for Engineers - Daily articles from December 1 to 25",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 言語が有効かチェック
  if (!routing.locales.includes(locale as "ja" | "en")) {
    notFound();
  }

  // 翻訳メッセージを取得
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </ThemeProvider>
        </SessionProvider>
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
