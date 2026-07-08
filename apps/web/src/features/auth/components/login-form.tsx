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
 */
export function LoginForm() {
  // API通信用カスタムフック
  const { login, isLoading, error: apiError } = useLogin();

  // フォーム状態の管理
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * フォーム送信ハンドラー
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
          {/* APIエラー（認証失敗など）の表示 */}
          {apiError && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
              {apiError}
            </div>
          )}

          {/* メールアドレス入力 */}
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
                    className="bg-input border-border focus-visible:ring-primary focus-visible:border-border aria-invalid:border-destructive/80 aria-invalid:focus-visible:ring-destructive/50 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:shadow-[0_0_15px_-2px_rgba(239,68,68,0.6)] transition-all duration-200"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* パスワード入力 */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">パスワード</FormLabel>
                <FormControl>
                  <PasswordInput
                    className="bg-input border-border focus-visible:ring-primary focus-visible:border-border aria-invalid:border-destructive/80 aria-invalid:focus-visible:ring-destructive/50 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:shadow-[0_0_15px_-2px_rgba(239,68,68,0.6)] transition-all duration-200"
                    {...field}
                  />
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

      <div className="text-center text-sm mt-6">
        <p className="text-muted-foreground">
          アカウントをお持ちでないですか？{" "}
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            新規登録
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
