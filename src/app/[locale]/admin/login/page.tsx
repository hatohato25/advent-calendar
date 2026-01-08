"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingFallback } from "@/components/ui/loading-fallback";
import { useRouter } from "@/i18n/routing";

function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errorInvalid"));
        setIsLoading(false);
        return;
      }

      // ログイン成功時は管理ダッシュボードにリダイレクト
      const callbackUrl = searchParams.get("callbackUrl") || "/admin";
      // callbackUrlからロケールプレフィックス（/ja, /en など）を削除
      // next-intlのルーターが自動的にロケールプレフィックスを追加するため、削除が必要
      const pathWithoutLocale = callbackUrl.replace(/^\/[a-z]{2}\//, "/");

      // リダイレクト実行
      // router.push()は非同期だが、リダイレクト中は読み込み状態を維持するためsetIsLoading(false)を呼ばない
      router.push(pathWithoutLocale);

      // ルーターの遷移完了を待ってからリフレッシュ
      // Vercel本番環境でのネットワーク遅延を考慮して少し待つ
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      setError(t("errorGeneric"));
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">{t("title")}</CardTitle>
        <CardDescription className="text-center">{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Suspense fallback={<LoadingFallback fullScreen={false} />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
