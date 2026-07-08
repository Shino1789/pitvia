import { z } from "zod";
import { USER_ROLES } from "@/shared/constants/role";
import { VALIDATION_MESSAGES } from "@/shared/messages/validation";
import { FIELD } from "@/shared/constants/field";

/**
 * 新規アカウント登録フォームのバリデーションスキーマ
 */
export const registerSchema = z
  .object({
    /** ユーザー権限の必須チェック */
    role: z.enum(USER_ROLES),

    /** ユーザー名のバリデーション */
    userName: z
      .string()
      .min(1, VALIDATION_MESSAGES.required(FIELD.USER_NAME))
      .max(100, VALIDATION_MESSAGES.maxLength(FIELD.USER_NAME, 100)),

    /** メールアドレスのバリデーション */
    email: z
      .string()
      .min(1, VALIDATION_MESSAGES.required(FIELD.EMAIL))
      .email(VALIDATION_MESSAGES.invalidFormat(FIELD.EMAIL)),

    /** パスワードのバリデーション */
    password: z
      .string()
      .min(8, VALIDATION_MESSAGES.minLength(FIELD.PASSWORD, 8))
      .max(128, VALIDATION_MESSAGES.maxLength(FIELD.PASSWORD, 128))
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, VALIDATION_MESSAGES.passwordRule),

    /** 確認用パスワードのバリデーション */
    confirmPassword: z
      .string()
      .min(1, VALIDATION_MESSAGES.required(FIELD.CONFIRM_PASSWORD)),
  })
  /** パスワードと確認用パスワードの一致チェック */
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.passwordMismatch,
    path: ["confirmPassword"], // エラーを confirmPassword フィールドに紐付ける
  });

/**
 * 新規アカウント登録フォームの入力値の型定義
 */
export type RegisterFormValues = z.infer<typeof registerSchema>;
