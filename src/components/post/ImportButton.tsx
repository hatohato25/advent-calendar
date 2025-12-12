"use client";

import matter from "gray-matter";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * ImportButtonコンポーネントのProps
 */
interface ImportButtonProps {
  /**
   * インポート成功時のコールバック
   * パースされたMarkdownデータを親コンポーネントに渡す
   */
  onImport: (data: {
    title: string;
    date: number;
    status: "draft" | "published";
    tags: string[];
    content: string;
  }) => void;
  /**
   * ボタンの無効化状態
   */
  disabled?: boolean;
}

/**
 * ImportButton - 記事編集ページのインポートボタン
 *
 * Markdownファイルをクライアントサイドで読み込み、フロントマターをパースして
 * 記事編集フォームに自動反映する機能を提供します。
 *
 * 機能:
 * - ファイル選択ダイアログ表示
 * - gray-matterでフロントマターパース
 * - バリデーション（ファイルサイズ、拡張子、フロントマター形式）
 * - 上書き確認ダイアログ表示
 * - エラーハンドリング
 */
export function ImportButton({ onImport, disabled = false }: ImportButtonProps) {
  const t = useTranslations("post.action");
  const tCommon = useTranslations("common");
  const tError = useTranslations("error");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importData, setImportData] = useState<{
    title: string;
    date: number;
    status: "draft" | "published";
    tags: string[];
    content: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * インポートされた記事のフロントマターバリデーションスキーマ
   * エクスポート機能との互換性を確保するため、必須フィールドを定義
   */
  const ImportedArticleSchema = z.object({
    title: z.string().min(1, tError("validation.required")),
    date: z.number().int().min(1).max(25, "dateは1〜25の範囲で指定してください"),
    status: z.enum(["draft", "published"]).optional().default("draft"),
    tags: z.array(z.string()).optional().default([]),
  });

  /**
   * ファイルをテキストとして読み込むヘルパー関数
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => {
        reject(new Error(tError("post.exportError")));
      };
      reader.readAsText(file);
    });
  };

  /**
   * ファイル選択時のハンドラ
   * ファイルサイズ・拡張子チェック、フロントマターパース、バリデーションを実行
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsLoading(true);

    try {
      // ファイルサイズチェック（5MB = 5 * 1024 * 1024 bytes）
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("ファイルサイズは5MB以下にしてください");
      }

      // 拡張子チェック
      if (!file.name.match(/\.(md|markdown)$/i)) {
        throw new Error("Markdownファイル（.md, .markdown）を選択してください");
      }

      // ファイル読み込み
      const fileContent = await readFileAsText(file);

      // フロントマターパース
      const { data: frontmatter, content } = matter(fileContent);

      // バリデーション
      const validatedData = ImportedArticleSchema.parse({
        title: frontmatter.title,
        date: frontmatter.date,
        status: frontmatter.status,
        tags: frontmatter.tags,
      });

      // インポートデータを一時保存
      setImportData({
        ...validatedData,
        content,
      });

      // 上書き確認ダイアログ表示
      setShowConfirmDialog(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0];
        setError(`${tError("validation.required")}: ${firstError.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(tError("post.createError"));
      }
    } finally {
      setIsLoading(false);
      // inputをリセット（同じファイルを再選択可能にする）
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * インポート実行ハンドラ
   * 上書き確認後、親コンポーネントにデータを渡す
   */
  const handleConfirmImport = () => {
    if (!importData) return;

    onImport(importData);
    setShowConfirmDialog(false);
    setImportData(null);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isLoading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isLoading ? tCommon("button.loading") : t("import")}
      </Button>

      {error && <div className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</div>}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("import")}しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在の編集内容が上書きされます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("button.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>{t("import")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
