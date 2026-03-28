import { TestModeBanner } from "@/components/auth/TestModeBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * 管理ページ用レイアウト
 * 認証が必要なページで使用
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* テストモードユーザーの場合にバナーを表示 */}
      <TestModeBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
