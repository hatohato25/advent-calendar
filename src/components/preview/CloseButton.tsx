"use client";

import { Button } from "@/components/ui/button";

/**
 * プレビューページの「閉じる」ボタン
 * WHY: window.close()を呼び出すためClient Componentが必要
 */
export function CloseButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        window.close();
      }}
    >
      閉じる
    </Button>
  );
}
