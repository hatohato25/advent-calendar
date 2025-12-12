import { z } from "zod";

// Calendar作成のバリデーションスキーマ
export const calendarCreateSchema = z.object({
  name: z
    .string()
    .min(1, "カレンダー名は必須です")
    .max(100, "カレンダー名は100文字以内で入力してください"),
  year: z
    .number()
    .int("年度は整数である必要があります")
    .min(1900, "年度は1900年以降である必要があります")
    .max(2100, "年度は2100年以前である必要があります"),
  slug: z
    .string()
    .min(3, "スラッグは3文字以上である必要があります")
    .max(50, "スラッグは50文字以内である必要があります")
    .regex(/^[a-z0-9-]+$/, "スラッグは英小文字、数字、ハイフンのみ使用できます"),
  description: z
    .string()
    .max(500, "説明文は500文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean().optional().default(false),
  theme: z.string().max(50, "テーマは50文字以内で入力してください").optional().or(z.literal("")),
});

// Calendar更新のバリデーションスキーマ（yearとslugは編集不可）
export const calendarUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "カレンダー名は必須です")
    .max(100, "カレンダー名は100文字以内で入力してください")
    .optional(),
  description: z
    .string()
    .max(500, "説明文は500文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean().optional(),
  theme: z.string().max(50, "テーマは50文字以内で入力してください").optional().or(z.literal("")),
});

// Calendar query paramsのバリデーションスキーマ
// URLSearchParams.get()はnullを返すため、nullable()を使用
export const calendarQuerySchema = z.object({
  year: z
    .string()
    .nullable()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1900).max(2100).optional()),
  isPublished: z
    .string()
    .nullable()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined))
    .pipe(z.boolean().optional()),
  theme: z.string().nullable().optional(),
  sort: z
    .string()
    .nullable()
    .transform((val) => val || "year")
    .pipe(z.enum(["year", "createdAt", "updatedAt", "name"])),
  order: z
    .string()
    .nullable()
    .transform((val) => val || "desc")
    .pipe(z.enum(["asc", "desc"])),
});

// 型推論
export type CalendarCreateInput = z.infer<typeof calendarCreateSchema>;
export type CalendarUpdateInput = z.infer<typeof calendarUpdateSchema>;
export type CalendarQueryParams = z.infer<typeof calendarQuerySchema>;
