"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { TestModeButton } from "@/components/auth/TestModeButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingFallback } from "@/components/ui/loading-fallback";

function LoginForm() {
  const t = useTranslations("auth.login");
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

      // ログイン成功 - 管理ダッシュボードにリダイレクト
      // next-intlのルーターがVercel本番環境で正常に動作しないため、window.location.hrefを使用
      const callbackUrl = searchParams.get("callbackUrl") || "/admin";

      // URLエンコードされている場合はデコード
      const decodedUrl = decodeURIComponent(callbackUrl);

      // ロケールプレフィックスが含まれているか確認
      const hasLocalePrefix = /^\/[a-z]{2}\//.test(decodedUrl);

      // ロケールプレフィックスがない場合は、現在のロケールを追加
      const redirectPath = hasLocalePrefix ? decodedUrl : `/ja${decodedUrl}`;

      // window.location.hrefで強制リダイレクト（確実に遷移する）
      window.location.href = redirectPath;
    } catch (_error) {
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

        {/* テストモードとの視覚的な区切り */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
              または
            </span>
          </div>
        </div>

        <TestModeButton />
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
