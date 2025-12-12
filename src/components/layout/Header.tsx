"use client";

import { Calendar, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface HeaderProps {
  /**
   * メニュー（ナビゲーション、ThemeToggle、ログアウト）を表示するか
   * デフォルト: true
   * WHY: 公開ページではシンプルなヘッダーのみを表示し、管理画面ではフルメニューを表示
   */
  showMenu?: boolean;
  /**
   * ロゴをクリックした際のリンク先
   * デフォルト: "/" (トップページ)
   * WHY: 記事ページからカレンダーページに戻れるようにするため
   */
  logoLink?: string;
}

/**
 * サイトヘッダー
 * ロゴ、ナビゲーション、テーマ切り替えボタンを含む
 * レスポンシブ対応（モバイルメニュー）
 * 認証済みの場合はログアウトボタンを表示
 *
 * WHY: showMenuプロップで公開ページと管理画面で異なる表示を実現
 * WHY: logoLinkプロップで記事ページからの戻り先をカスタマイズ可能に
 */
export function Header({ showMenu = true, logoLink = "/" }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const t = useTranslations("common");

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center">
        {/* ロゴ */}
        <Link href={logoLink} className="flex items-center space-x-2 text-lg font-semibold">
          <Calendar className="h-6 w-6" />
          <span>{t("appTitle")}</span>
        </Link>

        {/* デスクトップナビゲーション（showMenu=trueの場合のみ表示） */}
        {showMenu && (
          <nav className="ml-auto hidden items-center space-x-6 md:flex">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              {t("navigation.calendar")}
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t("navigation.postManagement")}
            </Link>
            {session && session.user.role === "admin" && (
              <>
                <Link
                  href="/admin/calendars"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {t("navigation.calendarManagement")}
                </Link>
                <Link
                  href="/admin/users"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {t("navigation.userManagement")}
                </Link>
                <Link
                  href="/admin/tags"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {t("navigation.tagManagement")}
                </Link>
              </>
            )}
            {session && (
              <Link
                href="/mypage"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {t("navigation.mypage")}
              </Link>
            )}
            <ThemeToggle />
            <LanguageSwitcher />
            {session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("navigation.logout")}</span>
              </Button>
            )}
          </nav>
        )}

        {/* モバイルメニューボタン（showMenu=trueの場合のみ表示） */}
        {showMenu && (
          <button
            type="button"
            className="ml-auto md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="メニューを開く"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}

        {/* モバイルナビゲーション（showMenu=trueの場合のみ表示） */}
        {showMenu && mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-16 border-b bg-background p-4 md:hidden">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navigation.calendar")}
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navigation.postManagement")}
              </Link>
              {session && session.user.role === "admin" && (
                <>
                  <Link
                    href="/admin/calendars"
                    className="text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("navigation.calendarManagement")}
                  </Link>
                  <Link
                    href="/admin/users"
                    className="text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("navigation.userManagement")}
                  </Link>
                  <Link
                    href="/admin/tags"
                    className="text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("navigation.tagManagement")}
                  </Link>
                </>
              )}
              {session && (
                <Link
                  href="/mypage"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("navigation.mypage")}
                </Link>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{t("theme.changeTheme")}:</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{t("language.changeLanguage")}:</span>
                <LanguageSwitcher />
              </div>
              {session && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-2 justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("navigation.logout")}</span>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
