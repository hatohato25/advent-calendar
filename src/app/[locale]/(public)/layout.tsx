import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * 公開ページ用レイアウト
 * Header、Footer、メインコンテンツを含む
 */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
