"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { type PasswordChangeFormValues, passwordChangeSchema } from "@/lib/validation/password";

/**
 * PasswordSectionコンポーネント
 * ユーザーのパスワード変更フォーム
 *
 * WHY: マイページでパスワードを変更できるようにするため
 */
export function PasswordSection() {
  const t = useTranslations("mypage.password");
  const tCommon = useTranslations("common");
  const tError = useTranslations("mypage.error");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // パスワード表示/非表示の切り替え
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
  });

  // パスワード変更処理
  const onSubmit = async (values: PasswordChangeFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "パスワードの変更に失敗しました");
      }

      setSuccess(t("changeSuccess"));

      // フォームをリセット
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : tError("passwordChangeFailed"));
    } finally {
      setLoading(false);
    }
  };

  // パスワード強度の計算
  // WHY: ユーザーにパスワードの強度を視覚的にフィードバック
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;

    // 長さ
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // 複雑さ
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return Math.min(strength, 4);
  };

  const newPassword = form.watch("newPassword");
  const passwordStrength = calculatePasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border p-6">
        {/* 現在のパスワード */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              placeholder={t("currentPasswordPlaceholder")}
              {...form.register("currentPassword")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.currentPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* 新しいパスワード */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("newPassword")}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder={t("newPasswordPlaceholder")}
              {...form.register("newPassword")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
          )}
          <p className="text-sm text-muted-foreground">{t("passwordHint")}</p>

          {/* パスワード強度インジケーター */}
          {newPassword && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{t("passwordStrength")}:</span>
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`transition-all ${
                      passwordStrength === 1
                        ? "w-1/4 bg-red-500"
                        : passwordStrength === 2
                          ? "w-2/4 bg-yellow-500"
                          : passwordStrength === 3
                            ? "w-3/4 bg-blue-500"
                            : passwordStrength === 4
                              ? "w-full bg-green-500"
                              : "w-0"
                    }`}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {passwordStrength === 1
                  ? t("passwordWeak")
                  : passwordStrength === 2
                    ? t("passwordFair")
                    : passwordStrength === 3
                      ? t("passwordGood")
                      : passwordStrength === 4
                        ? t("passwordStrong")
                        : ""}
              </p>
            </div>
          )}
        </div>

        {/* 新しいパスワード（確認） */}
        <div className="space-y-2">
          <Label htmlFor="newPasswordConfirm">{t("newPasswordConfirm")}</Label>
          <div className="relative">
            <Input
              id="newPasswordConfirm"
              type={showNewPasswordConfirm ? "text" : "password"}
              placeholder={t("newPasswordConfirmPlaceholder")}
              {...form.register("newPasswordConfirm")}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPasswordConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.formState.errors.newPasswordConfirm && (
            <p className="text-sm text-destructive">
              {form.formState.errors.newPasswordConfirm.message}
            </p>
          )}
        </div>

        {/* エラーメッセージ */}
        {error && <ErrorMessage message={error} />}

        {/* 成功メッセージ */}
        {success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        {/* 変更ボタン */}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center space-x-2">
              <Spinner size="sm" />
              <span>{tCommon("changing")}</span>
            </span>
          ) : (
            t("changeButton")
          )}
        </Button>
      </form>
    </div>
  );
}
