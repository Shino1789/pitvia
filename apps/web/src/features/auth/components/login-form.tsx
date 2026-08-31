"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { PasswordInput } from "./password-input";
import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
import { ROUTES } from "@/shared/constants/routes";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";

/**
 * ログインフォームコンポーネント
 *
 * @component
 */
export function LoginForm() {
  // ログイン処理カスタムフックから状態と関数を取得
  const { login, isLoading, error: apiError } = useLogin();

  // フォームバリデーションスキーマの初期化
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * フォーム送信時のイベントハンドラー
   *
   * @param data バリデーション済みのフォーム入力値
   */
  const onSubmit = async (data: LoginFormValues) => {
    await login(data);
  };

  return (
    <AuthLayout title="Pitvia" description="走るクルマのための整備記録">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* APIエラーが発生した際のエラーメッセージ表示 */}
          {apiError && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
              {apiError}
            </div>
          )}

          {/* メールアドレス入力フィールド */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">メールアドレス</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* パスワード入力フィールド */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">パスワード</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 送信ボタン */}
          <Button
            type="submit"
            className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_-4px] shadow-primary/50 pt-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>処理中...</span>
            ) : (
              <>
                ログイン
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* フッターリンク（新規登録への導線） */}
      <div className="text-center text-sm mt-6">
        <p className="text-muted-foreground">
          アカウントをお持ちでないですか？{" "}
          <Link
            href={ROUTES.REGISTER}
            className="text-primary hover:underline font-medium"
          >
            新規登録
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
