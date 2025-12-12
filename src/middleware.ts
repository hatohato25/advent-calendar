import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// next-intlミドルウェアを作成
const i18nMiddleware = createMiddleware(routing);

// 認証が必要なパスかどうかをチェック
const requiresAuth = (pathname: string) => {
  // 言語プレフィックスを除外してパスを判定
  const pathWithoutLocale = pathname.replace(/^\/(ja|en)/, "");
  return pathWithoutLocale.startsWith("/admin") && pathWithoutLocale !== "/admin/login";
};

// 管理者のみアクセス可能なパスかどうかをチェック
const requiresAdmin = (pathname: string) => {
  const pathWithoutLocale = pathname.replace(/^\/(ja|en)/, "");
  return (
    pathWithoutLocale.startsWith("/admin/users") || pathWithoutLocale.startsWith("/admin/tags")
  );
};

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // APIルート、静的ファイルは除外
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes("/uploads/")
  ) {
    return NextResponse.next();
  }

  // 1. i18nミドルウェアを実行
  const response = i18nMiddleware(request);

  // 2. 認証が必要なパスの場合、NextAuth.jsの認証チェック
  if (requiresAuth(pathname)) {
    // 現在の言語を取得
    const locale = pathname.match(/^\/(ja|en)/)?.[1] || "ja";

    return withAuth(() => response, {
      callbacks: {
        authorized: ({ token }) => {
          // 管理者のみアクセス可能なパスの場合
          if (requiresAdmin(pathname)) {
            return !!token && token.role === "admin";
          }
          // その他の管理ページは認証のみ必要
          return !!token;
        },
      },
      pages: {
        // ログインページも言語プレフィックス対応
        signIn: `/${locale}/admin/login`,
      },
    })(request as never, {} as never);
  }

  return response;
}

export const config = {
  // ミドルウェアを適用するパス
  matcher: [
    // 全てのパスにマッチ（除外パスは上記で処理）
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
