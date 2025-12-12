import { User } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Header } from "@/components/layout/Header";
import { PasswordSection } from "@/components/mypage/PasswordSection";
import { ProfileSection } from "@/components/mypage/ProfileSection";
import { prisma } from "@/lib/prisma";

/**
 * MyPageページ（Server Component）
 * ユーザーが自分自身のプロフィール情報を管理するページ
 *
 * WHY: ユーザーがパスワード変更、アイコン設定、表示名変更を行えるようにするため
 */
export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const t = await getTranslations("mypage");

  // 未認証の場合はログインページにリダイレクト
  if (!session || !session.user) {
    redirect(`/${locale}/admin/login`);
  }

  // データベースからユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <>
      <Header showMenu={true} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* プロフィール情報セクション */}
          <ProfileSection user={user} />

          {/* パスワード変更セクション */}
          <PasswordSection />
        </div>
      </div>
    </>
  );
}

/**
 * メタデータ生成（SEO）
 *
 * WHY: 2つのネームスペース（mypage、common）から翻訳を取得する必要があるため、
 * それぞれ別々にgetTranslationsを呼び出す
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mypage" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return {
    title: `${t("title")} | ${tCommon("appTitle")}`,
    description: t("subtitle"),
  };
}
