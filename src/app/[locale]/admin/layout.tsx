import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * 管理ページ用レイアウト
 * 認証が必要なページで使用
 * WHY: TestModeBannerはHeaderに内包されているため、ここでの個別設置は不要
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
