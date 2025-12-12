/**
 * パスワード関連のバリデーションスキーマ
 *
 * WHY: APIとフロントエンドで同じバリデーションロジックを使用することで、
 * 一貫性を保ち、保守性を向上させるため
 */

import { z } from "zod";

/**
 * パスワードの基本バリデーションルール
 *
 * WHY: パスワードポリシーを一箇所で定義することで、
 * 初回設定時とパスワード変更時で同じルールを保証し、
 * ポリシー変更時の修正漏れを防ぐため
 *
 * ルール:
 * - 8文字以上
 * - 英大文字を含む
 * - 英小文字を含む
 * - 数字を含む
 * - 記号 (@$!%*?&) を含む
 */
export const passwordValidation = z
  .string()
  .min(8, "パスワードは8文字以上である必要があります")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "パスワードは英大文字、英小文字、数字、記号を含む必要があります",
  );

/**
 * パスワード設定時のバリデーションスキーマ
 *
 * WHY: 初回パスワード設定時に使用
 * トークンとパスワード確認を含む
 */
export const setPasswordSchema = z
  .object({
    token: z.string().min(1, "トークンが必要です"),
    password: passwordValidation,
    passwordConfirm: z.string().min(1, "パスワード確認が必要です"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "パスワードが一致しません",
    path: ["passwordConfirm"],
  });

/**
 * パスワード変更のバリデーションスキーマ
 *
 * WHY: 初回パスワード登録時と同じ厳格なバリデーションを適用することで、
 * セキュリティレベルを統一し、弱いパスワードへの変更を防ぐため
 *
 * - 現在のパスワードと新しいパスワードは異なる必要がある
 * - 新しいパスワードは8文字以上、英大文字・英小文字・数字・記号を含む
 * - 新しいパスワードと確認用パスワードは一致する必要がある
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: passwordValidation,
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "パスワードが一致しません",
    path: ["newPasswordConfirm"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "新しいパスワードは現在のパスワードと異なる必要があります",
    path: ["newPassword"],
  });

/**
 * パスワード設定フォームの型
 */
export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

/**
 * パスワード変更フォームの型
 */
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
