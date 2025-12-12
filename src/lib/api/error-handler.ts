import { NextResponse } from "next/server";

/**
 * API エラーハンドリング関数
 *
 * すべてのAPI Routeで統一したエラーハンドリングを提供します。
 * 将来的なエラーモニタリング（Sentry等）の統合ポイントとしても機能します。
 *
 * @param error - キャッチしたエラーオブジェクト
 * @param context - エラーコンテキスト（ログ出力用）
 * @param customMessage - カスタムエラーメッセージ（省略時は"Internal Server Error"）
 * @returns NextResponse with error JSON
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   try {
 *     const data = await fetchData();
 *     return NextResponse.json(data);
 *   } catch (error) {
 *     return handleApiError(error, "GET /api/example", "Failed to fetch data");
 *   }
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context: string,
  customMessage?: string,
): NextResponse {
  // エラーログ出力
  // WHY: コンテキスト情報を含めることで、エラー発生箇所を特定しやすくする
  console.error(`[API Error] ${context}:`, error);

  // TODO: 将来的にエラーモニタリングサービス（Sentry等）にエラーを送信
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { tags: { context } });
  // }

  // エラーレスポンスを返却
  return NextResponse.json({ error: customMessage || "Internal Server Error" }, { status: 500 });
}
