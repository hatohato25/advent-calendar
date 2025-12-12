"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Spinner } from "@/components/ui/spinner";
import { generateAvatarUrl } from "@/lib/avatar";
import { AVATAR_IMAGE_UPLOAD } from "@/lib/upload/constants";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  username: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onDeleteSuccess: () => void;
}

/**
 * AvatarUploadコンポーネント
 * ユーザーのアバター画像をアップロード・プレビュー・削除する
 *
 * WHY: マイページでプロフィール画像を管理できるようにするため
 */
export function AvatarUpload({
  currentAvatarUrl,
  username,
  onUploadSuccess,
  onDeleteSuccess,
}: AvatarUploadProps) {
  const t = useTranslations("mypage.profile");
  const tError = useTranslations("mypage.error");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // デフォルトアバターURL（UI Avatars）
  // WHY: avatarUrlがNULLの場合、UI Avatarsで自動生成
  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    if (currentAvatarUrl) return currentAvatarUrl;
    return generateAvatarUrl(username, 256);
  };

  // ファイル選択ハンドラー
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // クライアントサイドバリデーション
    // WHY: サーバーに送信する前に早期エラー検出
    if (file.size > AVATAR_IMAGE_UPLOAD.MAX_FILE_SIZE) {
      setError(tError("fileSizeExceeded"));
      return;
    }

    if (
      !AVATAR_IMAGE_UPLOAD.ALLOWED_MIME_TYPES.includes(
        file.type as (typeof AVATAR_IMAGE_UPLOAD.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      setError(tError("invalidFileType"));
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // アップロード処理
    await handleUpload(file);
  };

  // アップロード処理
  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "アップロードに失敗しました");
      }

      const { avatarUrl } = await response.json();

      // 成功時のコールバック
      onUploadSuccess(avatarUrl);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : tError("uploadFailed"));
      setPreviewUrl(null);
    } finally {
      setUploading(false);

      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!currentAvatarUrl) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/users/me/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      // 成功時のコールバック
      onDeleteSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : tError("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {/* アバター画像プレビュー */}
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-700">
          <Image
            src={getAvatarUrl()}
            alt={t("avatar")}
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </div>

        {/* ボタン群 */}
        <div className="flex space-x-2">
          {/* アップロードボタン */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deleting}
          >
            {uploading ? (
              <span className="flex items-center space-x-2">
                <Spinner size="sm" />
                <span>{t("uploading")}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>{t("avatarUpload")}</span>
              </span>
            )}
          </Button>

          {/* 削除ボタン（アイコン設定済みの場合のみ表示） */}
          {currentAvatarUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={uploading || deleting}
            >
              {deleting ? (
                <span className="flex items-center space-x-2">
                  <Spinner size="sm" />
                  <span>{t("deleting")}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <X className="h-4 w-4" />
                  <span>{t("avatarDelete")}</span>
                </span>
              )}
            </Button>
          )}
        </div>

        {/* 非表示のファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* エラーメッセージ */}
      {error && <ErrorMessage message={error} />}

      {/* ヘルプテキスト */}
      <p className="text-sm text-muted-foreground">
        {t("avatarHelp") || "JPEG、PNG、GIF、WebP形式の画像（2MB以下）をアップロードできます"}
      </p>
    </div>
  );
}
