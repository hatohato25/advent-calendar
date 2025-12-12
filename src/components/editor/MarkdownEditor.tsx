"use client";

import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  placeholder = "記事の内容をMarkdown形式で入力してください...",
}: MarkdownEditorProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのマウント確認
  // next-themesのテーマ取得はクライアントサイドでのみ動作するため
  useEffect(() => {
    setMounted(true);
  }, []);

  // テーマに応じた設定
  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark");

  // CodeMirrorの拡張機能
  const extensions = [
    markdown(),
    EditorView.lineWrapping, // 行の折り返し
  ];

  // キーボードショートカット（Ctrl+S / Cmd+S で保存）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);

  // マウントされるまでプレースホルダーを表示
  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center border border-border rounded-lg bg-muted/50">
        <p className="text-muted-foreground text-sm">エディタを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-border">
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        theme={isDark ? oneDark : undefined}
        onChange={onChange}
        placeholder={placeholder}
        className="h-full text-base"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          highlightSelectionMatches: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
