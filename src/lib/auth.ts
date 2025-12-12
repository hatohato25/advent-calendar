import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * サーバーサイドでセッションを取得するヘルパー関数
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * 認証が必須の処理で使用するヘルパー関数
 * 未認証の場合はエラーをスローする
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error("認証が必要です");
  }

  return session;
}

/**
 * パスワードをハッシュ化する
 * bcryptを使用（saltRounds: 10）
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * パスワードを検証する
 * ハッシュ化されたパスワードと平文パスワードを比較
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 管理者権限をチェックする
 * 管理者でない場合はエラーをスローする
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    throw new Error("管理者権限が必要です");
  }

  return session;
}

/**
 * 一時トークンを生成する
 * @returns {token: string, expiresAt: Date}
 */
export function generateFirstLoginToken(): {
  token: string;
  expiresAt: Date;
} {
  // 暗号学的に安全な乱数を生成（32バイト = 64文字の16進数文字列）
  const crypto = require("node:crypto");
  const token = crypto.randomBytes(32).toString("hex");

  // 有効期限: 7日後
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return { token, expiresAt };
}

/**
 * 一時トークンを検証する
 */
export async function verifyFirstLoginToken(token: string) {
  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({
    where: { firstLoginToken: token },
  });

  if (!user) {
    return { valid: false, error: "トークンが無効です" as const };
  }

  if (!user.firstLoginTokenExpiresAt || user.firstLoginTokenExpiresAt < new Date()) {
    return { valid: false, error: "トークンの有効期限が切れています" as const };
  }

  return {
    valid: true as const,
    username: user.username,
    email: user.email,
    userId: user.id,
  };
}

/**
 * ユーザーが記事を編集できるかチェックする
 */
export async function canEditArticle(userId: string, articleDate: number): Promise<boolean> {
  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return false;

  // adminは全て編集可能
  if (user.role === "admin") return true;

  // editorは許可された日程のみ編集可能
  if (user.role === "editor") {
    const allowedDates = user.allowedDates ? JSON.parse(user.allowedDates) : [];
    return allowedDates.includes(articleDate);
  }

  return false;
}

/**
 * ユーザーの許可日程を取得する
 */
export function getAllowedDates(user: { role: string; allowedDates: string | null }): number[] {
  if (user.role === "admin") {
    // adminは全日程を許可
    return Array.from({ length: 25 }, (_, i) => i + 1);
  }

  if (user.role === "editor" && user.allowedDates) {
    return JSON.parse(user.allowedDates);
  }

  return [];
}

/**
 * ユーザーがカレンダーにアクセスできるかチェックする
 */
export async function canAccessCalendar(userId: string, calendarId: string): Promise<boolean> {
  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      calendarPermissions: {
        where: { calendarId },
      },
    },
  });

  if (!user) return false;

  // 管理者は全カレンダーにアクセス可能
  if (user.role === "admin") return true;

  // 編集者は権限があるカレンダーのみアクセス可能
  if (user.role === "editor") {
    return user.calendarPermissions.length > 0;
  }

  return false;
}

/**
 * ユーザーがカレンダー内の記事を編集できるかチェックする
 */
export async function canEditArticleInCalendar(
  userId: string,
  calendarId: string,
  articleDate: number,
): Promise<boolean> {
  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      calendarPermissions: {
        where: { calendarId },
      },
    },
  });

  if (!user) return false;

  // 管理者は全記事を編集可能
  if (user.role === "admin") return true;

  // 編集者は許可された日付のみ編集可能
  if (user.role === "editor") {
    const permission = user.calendarPermissions[0];
    if (!permission) return false;

    const allowedDates = JSON.parse(permission.allowedDates);
    return allowedDates.includes(articleDate);
  }

  return false;
}

/**
 * ユーザーのカレンダー内の許可日付を取得
 */
export async function getAllowedDatesForCalendar(
  userId: string,
  calendarId: string,
): Promise<number[]> {
  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      calendarPermissions: {
        where: { calendarId },
      },
    },
  });

  if (!user) return [];

  // 管理者は全日付を許可
  if (user.role === "admin") {
    return Array.from({ length: 25 }, (_, i) => i + 1);
  }

  // 編集者は許可された日付のみ
  if (user.role === "editor") {
    const permission = user.calendarPermissions[0];
    if (!permission) return [];

    return JSON.parse(permission.allowedDates);
  }

  return [];
}

/**
 * ユーザーがアクセス可能なカレンダー一覧を取得
 * WHY: editorユーザーは許可されたカレンダーのみアクセス可能
 * WHY: adminユーザーは全カレンダーにアクセス可能
 */
export async function getUserAccessibleCalendars(userId: string) {
  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      calendarPermissions: {
        include: {
          calendar: true,
        },
        orderBy: {
          calendar: { year: "desc" },
        },
      },
    },
  });

  if (!user) return [];

  // 管理者は全カレンダーにアクセス可能
  if (user.role === "admin") {
    return await prisma.calendar.findMany({
      orderBy: { year: "desc" },
    });
  }

  // 編集者は権限があるカレンダーのみ
  if (user.role === "editor") {
    return user.calendarPermissions.map((p: (typeof user.calendarPermissions)[0]) => p.calendar);
  }

  return [];
}
