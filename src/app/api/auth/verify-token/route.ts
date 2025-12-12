import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { verifyFirstLoginToken } from "@/lib/auth";

/**
 * GET /api/auth/verify-token?token=xxx
 * 一時トークンの有効性を検証
 */
export async function GET(request: Request) {
  try {
    // クエリパラメータからtokenを取得
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "トークンが指定されていません" },
        { status: 400 },
      );
    }

    // トークン検証
    const result = await verifyFirstLoginToken(token);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      username: result.username,
      email: result.email,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/auth/verify-token", "トークンの検証に失敗しました");
  }
}
