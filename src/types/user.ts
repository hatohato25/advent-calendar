import type { User as PrismaUser } from "@prisma/client";

// Prismaの生成型をそのまま使用
export type User = PrismaUser;

// 役職の型定義
export type UserRole = "admin" | "editor";

// パスワードハッシュと一時トークンを除外した公開用型
export type PublicUser = Omit<User, "passwordHash" | "firstLoginToken">;

// ユーザー作成時の入力型
export type UserCreateInput = {
  username: string;
  email: string;
  role: UserRole;
  allowedDates?: number[]; // editorの場合のみ
};

// ユーザー更新時の入力型
export type UserUpdateInput = {
  username?: string;
  email?: string;
  role?: UserRole;
  allowedDates?: number[];
};

// パスワード設定時の入力型
export type SetPasswordInput = {
  token: string;
  password: string;
  passwordConfirm: string;
};

// セッション用の型
export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  allowedDates: number[];
};

// ユーザー一覧表示用の型
export type UserListItem = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  allowedDates: number[]; // 後方互換性のため残す（グローバル許可日程は廃止）
  calendars: {
    id: string;
    name: string;
    slug: string;
  }[];
  hasPassword: boolean; // パスワード設定済みか
  createdAt: Date;
};
