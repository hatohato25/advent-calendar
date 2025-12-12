import { z } from "zod";

/**
 * ユーザー作成時のバリデーションスキーマ
 * ユーザー名はメールアドレスから自動生成されるため、クライアントから受け取らない
 */
export const userCreateSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["admin", "editor"]),
  allowedDates: z
    .array(z.number().min(1).max(25))
    .optional()
    .refine(
      (dates) => {
        if (!dates) return true;
        return dates.every((date) => date >= 1 && date <= 25);
      },
      { message: "許可日程は1-25の範囲内である必要があります" },
    ),
});

/**
 * ユーザー更新時のバリデーションスキーマ
 * 更新時はusernameも受け取る（作成時と異なり、ユーザー名の変更を許可）
 */
export const userUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "ユーザー名は3文字以上である必要があります")
    .max(20, "ユーザー名は20文字以内である必要があります")
    .regex(/^[a-zA-Z0-9_]+$/, "ユーザー名は英数字とアンダースコアのみ使用できます")
    .optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
  role: z.enum(["admin", "editor"]).optional(),
  allowedDates: z
    .array(z.number().min(1).max(25))
    .optional()
    .refine(
      (dates) => {
        if (!dates) return true;
        return dates.every((date) => date >= 1 && date <= 25);
      },
      { message: "許可日程は1-25の範囲内である必要があります" },
    ),
});
