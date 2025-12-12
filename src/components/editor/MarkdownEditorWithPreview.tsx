"use client";

import { Eye, EyeOff, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "./EditorToolbar";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";

interface MarkdownEditorWithPreviewProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function MarkdownEditorWithPreview({
  value,
  onChange,
  onSave,
  saveStatus = "idle",
  autoSave = false,
  autoSaveDelay = 2000,
}: MarkdownEditorWithPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [localValue, setLocalValue] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);

  // 外部からのvalue変更を反映（インポート対応）
  // localValueとvalueが異なる場合のみ更新することで、無限ループを防ぐ
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  // 自動保存機能（デバウンス処理）
  useEffect(() => {
    if (!autoSave || !onSave) return;

    const timer = setTimeout(() => {
      if (localValue !== value) {
        onSave();
      }
    }, autoSaveDelay);

    return () => clearTimeout(timer);
  }, [localValue, value, autoSave, autoSaveDelay, onSave]);

  // ページ離脱時の警告（未保存の変更がある場合）
  useEffect(() => {
    if (!autoSave) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "saving" || localValue !== value) {
        e.preventDefault();
        // 一部のブラウザでは空文字列を設定することで警告ダイアログが表示される
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus, localValue, value, autoSave]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInsert = (syntax: string, _offset = 0) => {
    // カーソル位置に記法を挿入
    // この実装はシンプルな末尾追加
    // 実際のカーソル位置への挿入はCodeMirrorのAPIを使用する必要がある
    // _offset パラメータは将来の実装で使用予定
    const newValue = localValue + syntax;
    handleChange(newValue);
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "保存中...";
      case "saved":
        return "保存済み";
      case "error":
        return "保存エラー";
      default:
        return "";
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case "saving":
        return "text-blue-600 dark:text-blue-400";
      case "saved":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <EditorToolbar onInsert={handleInsert} />
        <div className="flex items-center gap-2">
          {/* 保存状態 */}
          {saveStatus !== "idle" && (
            <span className={`text-sm ${getSaveStatusColor()}`}>{getSaveStatusText()}</span>
          )}
          {/* プレビュー切り替え */}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? "プレビューを非表示" : "プレビューを表示"}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">
              {showPreview ? "プレビューを非表示" : "プレビューを表示"}
            </span>
          </Button>
          {/* 手動保存ボタン */}
          {onSave && !autoSave && (
            <Button
              variant="default"
              size="sm"
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
            >
              <Save className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">保存</span>
            </Button>
          )}
        </div>
      </div>

      {/* エディタとプレビュー */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full ${showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-0" : ""}`}>
          {/* エディタ */}
          <div ref={editorRef} className="h-full overflow-hidden">
            <MarkdownEditor value={localValue} onChange={handleChange} onSave={onSave} />
          </div>

          {/* プレビュー */}
          {showPreview && (
            <div className="h-full overflow-auto border-l border-border bg-background">
              <MarkdownPreview content={localValue} debounceMs={500} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
