"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AvatarUpload } from "@/components/mypage/AvatarUpload";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface ProfileSectionProps {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
}

// プロフィール更新フォームのバリデーションスキーマ
const profileFormSchema = z.object({
  displayName: z.string().max(50, "表示名は50文字以内である必要があります").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * ProfileSectionコンポーネント
 * ユーザーのプロフィール情報を表示・編集する
 *
 * WHY: マイページでプロフィール情報を管理できるようにするため
 */
export function ProfileSection({ user }: ProfileSectionProps) {
  const t = useTranslations("mypage.profile");
  const tCommon = useTranslations("common");
  const tError = useTranslations("mypage.error");
  const tSuccess = useTranslations("mypage.profile");

  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName || "",
    },
  });

  // プロフィール更新処理
  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "プロフィールの更新に失敗しました");
      }

      const data = await response.json();
      setSuccess(tSuccess("saveSuccess"));

      // フォームをリセット
      form.reset({ displayName: data.displayName || "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : tError("updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  // アバターアップロード成功時のコールバック
  const handleAvatarUploadSuccess = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    setSuccess(tSuccess("uploadSuccess"));
  };

  // アバター削除成功時のコールバック
  const handleAvatarDeleteSuccess = () => {
    setAvatarUrl(null);
    setSuccess(tSuccess("deleteSuccess"));
  };

  return (
    <div className="space-y-6">
      {/* アバター画像 */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">{t("avatar")}</h3>
        <AvatarUpload
          currentAvatarUrl={avatarUrl}
          username={user.username}
          onUploadSuccess={handleAvatarUploadSuccess}
          onDeleteSuccess={handleAvatarDeleteSuccess}
        />
      </div>

      {/* プロフィール情報フォーム */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border p-6">
        <h3 className="text-lg font-semibold">{t("basicInfo")}</h3>

        {/* 表示名 */}
        <div className="space-y-2">
          <Label htmlFor="displayName">{t("displayName")}</Label>
          <Input
            id="displayName"
            type="text"
            placeholder={t("displayNamePlaceholder")}
            {...form.register("displayName")}
            disabled={loading}
          />
          {form.formState.errors.displayName && (
            <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
          )}
          <p className="text-sm text-muted-foreground">{t("displayNameHelp")}</p>
        </div>

        {/* メールアドレス（読み取り専用） */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
          <p className="text-sm text-muted-foreground">{t("emailReadOnly")}</p>
        </div>

        {/* 登録日時（読み取り専用） */}
        <div className="space-y-2">
          <Label htmlFor="createdAt">{t("createdAt")}</Label>
          <Input
            id="createdAt"
            type="text"
            value={new Date(user.createdAt).toLocaleString("ja-JP")}
            disabled
            className="bg-muted"
          />
        </div>

        {/* エラーメッセージ */}
        {error && <ErrorMessage message={error} />}

        {/* 成功メッセージ */}
        {success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        {/* 保存ボタン */}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center space-x-2">
              <Spinner size="sm" />
              <span>{tCommon("button.saving")}</span>
            </span>
          ) : (
            t("saveButton")
          )}
        </Button>
      </form>
    </div>
  );
}
