import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/cleanup-test-users
 * 期限切れのテストユーザーとその関連データを削除する
 *
 * Vercel Cron Jobsによって1時間ごとに自動実行される（vercel.json参照）。
 * CRON_SECRETによる認証でスパムリクエストを防止する。
 */
export async function GET(request: Request) {
  try {
    // CRON_SECRETで認証チェック
    // WHY: Cron JobのエンドポイントはVercel外部からも到達可能なため、
    //      Bearerトークン認証で不正なリクエストを防止する
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET が設定されていません");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 期限切れのテストユーザーを検索
    const expiredTestUsers = await prisma.user.findMany({
      where: {
        isTestUser: true,
        testUserExpiresAt: { lt: now },
      },
      select: {
        id: true,
        username: true,
        testUserExpiresAt: true,
      },
    });

    if (expiredTestUsers.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const expiredUserIds = expiredTestUsers.map((u) => u.id);

    // テストユーザーを削除
    // WHY: カスケード削除設定により、記事・カレンダー・カレンダー権限も自動削除される
    //      (schema.prisma の onDelete: Cascade 参照)
    await prisma.user.deleteMany({
      where: {
        id: { in: expiredUserIds },
      },
    });

    // 注意: Vercel本番環境では public/uploads/ はエフェメラルストレージのため、
    //       デプロイ後にリセットされる。ローカル開発環境では画像ファイルが残る可能性があるが、
    //       本番環境では不要な処理となるため、ファイル削除処理は省略する。

    console.log(`[Cron] 期限切れテストユーザーを削除: ${expiredUserIds.length}件`);

    return NextResponse.json({ deleted: expiredUserIds.length });
  } catch (error) {
    return handleApiError(
      error,
      "GET /api/cron/cleanup-test-users",
      "テストユーザーのクリーンアップに失敗しました",
    );
  }
}
