import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/test-mode
 * テストユーザーを自動生成し、テストユーザーIDを返す
 *
 * 招待フローを経ずにサービスをすぐに体験できるよう、
 * 6時間後に自動削除されるテストユーザーを作成する
 */
export async function POST() {
  try {
    const uuid = randomUUID();
    // ユニーク性を確保するためUUIDの先頭8文字を使用
    const shortId = uuid.slice(0, 8);

    // テストユーザー有効期限: 作成時刻から6時間後
    const testUserExpiresAt = new Date();
    testUserExpiresAt.setHours(testUserExpiresAt.getHours() + 6);

    const user = await prisma.user.create({
      data: {
        username: `test-user-${shortId}`,
        email: `test-${shortId}@test.example.com`,
        role: "admin",
        isTestUser: true,
        testUserExpiresAt,
      },
    });

    return NextResponse.json({ testUserId: user.id });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/test-mode", "テストユーザーの作成に失敗しました");
  }
}
