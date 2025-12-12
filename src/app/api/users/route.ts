import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/error-handler";
import { generateFirstLoginToken, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validation/user";
import type { UserListItem } from "@/types/user";

/**
 * GET /api/users
 * ユーザー一覧を取得（adminのみ）
 */
export async function GET() {
  try {
    // 管理者権限チェック
    await requireAdmin();

    // ユーザー一覧を取得（passwordHashを除外）
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        allowedDates: true,
        passwordHash: true, // hasPasswordの計算に必要
        createdAt: true,
        calendarPermissions: {
          select: {
            calendar: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // UserListItem型に変換
    const userList: UserListItem[] = users.map((user: (typeof users)[0]) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as "admin" | "editor",
      allowedDates: user.allowedDates ? JSON.parse(user.allowedDates) : [],
      calendars: user.calendarPermissions.map(
        (permission: (typeof user.calendarPermissions)[0]) => permission.calendar,
      ),
      hasPassword: user.passwordHash !== null,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: userList });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "認証が必要です") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return handleApiError(error, "GET /api/users", "ユーザー一覧の取得に失敗しました");
  }
}

/**
 * POST /api/users
 * ユーザーを新規作成（adminのみ）
 */
export async function POST(request: Request) {
  try {
    // 管理者権限チェック
    await requireAdmin();

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validation = userCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "バリデーションエラー",
          details: validation.error.issues.map(
            (err: (typeof validation.error.issues)[0]) => err.message,
          ),
        },
        { status: 400 },
      );
    }

    const { email, role, allowedDates } = validation.data;

    // メールアドレスからユーザー名を自動生成
    const username = email.split("@")[0];

    // ユーザー名・メールアドレスの重複チェック
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      // より詳細なエラーメッセージを提供
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 409 },
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          {
            error: `ユーザー名 "${username}" は既に使用されています（別のメールアドレスで登録済み）`,
          },
          { status: 409 },
        );
      }
    }

    // 一時トークン生成
    const { token, expiresAt } = generateFirstLoginToken();

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        username,
        email,
        role,
        allowedDates: allowedDates ? JSON.stringify(allowedDates) : null,
        passwordHash: null, // 初回ログイン前はnull
        firstLoginToken: token,
        firstLoginTokenExpiresAt: expiresAt,
      },
    });

    // 初回ログイン用URL生成
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const firstLoginUrl = `${baseUrl}/auth/first-login?token=${token}`;

    // passwordHashとfirstLoginTokenを除外して返却
    const publicUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      allowedDates: user.allowedDates,
      firstLoginTokenExpiresAt: user.firstLoginTokenExpiresAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({ user: publicUser, firstLoginUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "管理者権限が必要です") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "認証が必要です") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return handleApiError(error, "POST /api/users", "ユーザーの作成に失敗しました");
  }
}
