import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/shared/messages/validation";
import { FIELD } from "@/shared/constants/field";

/**
 * ログインフォームのバリデーションスキーマ
 */
export const loginSchema = z.object({
  /** メールアドレスのバリデーション */
  email: z
    .string()
    .min(1, { message: VALIDATION_MESSAGES.required(FIELD.EMAIL) })
    .pipe(z.email({ message: VALIDATION_MESSAGES.invalidFormat(FIELD.EMAIL) })),

  /** パスワードのバリデーション */
  password: z.string().min(1, VALIDATION_MESSAGES.required(FIELD.PASSWORD)),
});

/**
 * ログインフォームの入力値の型定義
 */
export type LoginFormValues = z.infer<typeof loginSchema>;
