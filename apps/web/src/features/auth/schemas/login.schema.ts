import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({ message: "メールアドレスの形式が正しくありません" })
    .min(1, "メールアドレスは必須です"),
  password: z.string().min(1, "パスワードは必須です"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
