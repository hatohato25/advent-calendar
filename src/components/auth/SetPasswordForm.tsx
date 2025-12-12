"use client";

import { Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface SetPasswordFormProps {
  token: string;
  username: string;
  email: string;
}

export function SetPasswordForm({ token, username, email }: SetPasswordFormProps) {
  const t = useTranslations("auth.firstLogin");
  const tLabel = useTranslations("common.label");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== passwordConfirm) {
      setError(t("error.passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, passwordConfirm }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("error.setPasswordFailed"));
      }

      // 自動ログイン
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = "/admin";
      } else {
        throw new Error(t("error.loginFailed"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generic"));
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <div className="rounded-full bg-primary/10 p-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">{t("setPasswordTitle")}</CardTitle>
        <CardDescription className="text-center">{t("setPasswordDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{tLabel("username")}</Label>
            <div className="text-sm text-muted-foreground">{username}</div>
          </div>

          <div className="space-y-2">
            <Label>{tLabel("email")}</Label>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {t("password")} {tLabel("required")}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="h-11"
            />
            {password && <PasswordStrengthIndicator password={password} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">
              {t("passwordConfirm")} {tLabel("required")}
            </Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              className="h-11"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 transition-all hover:shadow-md"
          >
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
