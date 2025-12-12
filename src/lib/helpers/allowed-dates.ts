/**
 * allowedDates（許可日程）のJSON変換ヘルパー関数
 *
 * WHY: データベースではJSON文字列として保存されるallowedDatesを
 * アプリケーションコードでは配列として扱うための変換処理を集約
 * JSON.parseとJSON.stringifyの繰り返しを共通化して、型安全性とエラーハンドリングを一箇所で管理
 */

/**
 * allowedDatesのJSON文字列を配列にパース
 *
 * WHY: データベースから取得したJSON文字列を安全に配列に変換
 * パースエラーが発生した場合は空配列を返してアプリケーションの継続性を保つ
 *
 * @param allowedDates - JSON文字列（例: "[1, 2, 3]"）またはnull
 * @returns パースされた日程の配列（1-25の数値）
 */
export function parseAllowedDates(allowedDates: string | null): number[] {
  if (!allowedDates) {
    return [];
  }

  try {
    const parsed = JSON.parse(allowedDates);
    // WHY: パース結果が配列であることを確認して型安全性を担保
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    // WHY: パースエラーが発生しても空配列を返すことでエラーの伝播を防ぐ
    // ログ出力は行わない（データベースの不整合は別の手段で検知すべき）
    return [];
  }
}

/**
 * allowedDates配列をJSON文字列に変換
 *
 * WHY: アプリケーション内の配列データをデータベース保存用のJSON文字列に変換
 * 空配列の場合はnullを返すことでデータベースの容量を節約
 *
 * @param allowedDates - 日程の配列（1-25の数値）
 * @returns JSON文字列（例: "[1, 2, 3]"）または空配列の場合はnull
 */
export function stringifyAllowedDates(allowedDates: number[]): string | null {
  // WHY: 空配列の場合はnullを返すことでデータベースの不要なJSON保存を回避
  if (!allowedDates || allowedDates.length === 0) {
    return null;
  }

  return JSON.stringify(allowedDates);
}
