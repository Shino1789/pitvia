import { z } from "zod";
import { USER_ROLES } from "@/shared/constants/role";

export const registerSchema = z
  .object({
    role: z.enum(USER_ROLES),

    userName: z
      .string()
      .min(1, "ユーザー名は必須です")
      .max(100, "ユーザー名は100文字以内で入力してください"),

    email: z
      .string()
      .min(1, "メールアドレスは必須です")
      .email("メールアドレスの形式が正しくありません"),

    password: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください")
      .max(128, "パスワードは128文字以内です")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "英字と数字を少なくとも1文字ずつ含めてください",
      ),

    confirmPassword: z.string().min(1, "確認用パスワードは必須です"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;
