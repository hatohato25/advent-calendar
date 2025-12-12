"use client";

import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface EditorToolbarProps {
  onInsert: (syntax: string, offset?: number) => void;
}

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  syntax: string;
  offset?: number; // カーソル位置のオフセット（例: リンク挿入後にカーソルをURL入力位置に移動）
}

const toolbarButtons: ToolbarButton[] = [
  { icon: Heading1, label: "見出し1", syntax: "# ", offset: 0 },
  { icon: Heading2, label: "見出し2", syntax: "## ", offset: 0 },
  { icon: Heading3, label: "見出し3", syntax: "### ", offset: 0 },
  { icon: Bold, label: "太字", syntax: "****", offset: -2 },
  { icon: Italic, label: "斜体", syntax: "__", offset: -1 },
  { icon: Code, label: "コード", syntax: "``", offset: -1 },
  { icon: Quote, label: "引用", syntax: "> ", offset: 0 },
  { icon: List, label: "リスト", syntax: "- ", offset: 0 },
  { icon: ListOrdered, label: "番号付きリスト", syntax: "1. ", offset: 0 },
  { icon: Link, label: "リンク", syntax: "[](url)", offset: -5 },
];

export function EditorToolbar({ onInsert }: EditorToolbarProps) {
  // 画像アップロード用の状態管理
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (button: ToolbarButton) => {
    onInsert(button.syntax, button.offset);
  };

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setIsUploading(true);

    try {
      // クライアントサイドバリデーション
      // WHY: サーバー負荷を軽減するため、クライアント側で事前チェック

      // 1. ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("画像サイズは5MB以下にしてください");
      }

      // 2. MIMEタイプチェック
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("JPEG、PNG、GIF、WebP形式の画像を選択してください");
      }

      // 3. FormData作成
      const formData = new FormData();
      formData.append("file", file);

      // 4. アップロードリクエスト
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "アップロードに失敗しました");
      }

      const { url, alt } = await response.json();

      // 5. Markdown形式でエディタに挿入
      const markdown = `![${alt}](${url})`;
      onInsert(markdown, 0);
    } catch (error) {
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError("画像のアップロードに失敗しました");
      }
    } finally {
      setIsUploading(false);
      // inputをリセット（同じファイルを再選択可能にする）
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/50">
        {toolbarButtons.map((button) => (
          <Button
            key={button.label}
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => handleClick(button)}
            title={button.label}
            className="h-8 w-8 p-0"
          >
            <button.icon className="h-4 w-4" />
            <span className="sr-only">{button.label}</span>
          </Button>
        ))}

        {/* 画像アップロードボタン */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="画像をアップロード"
          className="h-8 w-8 p-0"
        >
          <Image className="h-4 w-4" />
          <span className="sr-only">画像</span>
        </Button>

        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => onInsert("```\n\n```", -4)}
          title="コードブロック"
          className="h-8 px-2 text-xs"
        >
          <Code className="h-4 w-4 mr-1" />
          コードブロック
        </Button>
      </div>

      {/* ローディング状態表示 */}
      {isUploading && (
        <div className="px-2 py-1 text-sm text-muted-foreground bg-muted/50 border-t border-border">
          画像をアップロード中...
        </div>
      )}

      {/* エラーメッセージ表示 */}
      {uploadError && (
        <div className="px-2 py-1 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-t border-red-200 dark:border-red-800">
          {uploadError}
        </div>
      )}
    </>
  );
}
