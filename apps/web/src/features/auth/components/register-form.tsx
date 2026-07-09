// apps/web/src/features/auth/components/register-form.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form"; // ★ useWatch をインポート
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { RoleSelector } from "./role-selector";
import { PasswordInput } from "./password-input";
import { useRegister } from "../hooks/use-register";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/register.schema";
import type { UserRole } from "@/shared/constants/role";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";

export function RegisterForm() {
  const {
    register: submitRegister,
    isLoading,
    error: apiError,
  } = useRegister();
  const [agreeTerms, setAgreeTerms] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "OWNER",
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // ★ form.watch の代わりに useWatch を使用（React Compiler の警告を回避）
  const currentRole = useWatch({
    control: form.control,
    name: "role",
  });

  /** ロール選択が変更された際のハンドラー */
  const handleRoleChange = (role: UserRole) => {
    form.setValue("role", role, { shouldValidate: true });
  };

  /**
   * フォーム送信時のハンドラー
   */
  const onSubmit = async (data: RegisterFormValues) => {
    if (!agreeTerms) return;

    await submitRegister({
      role: data.role,
      userName: data.userName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  // 共通の入力枠スタイル
  const inputClassName =
    "bg-input border-border focus-visible:ring-primary focus-visible:border-border aria-invalid:border-destructive/80 aria-invalid:focus-visible:ring-destructive/50 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:shadow-[0_0_15px_-2px_rgba(239,68,68,0.6)] transition-all duration-200";

  return (
    <AuthLayout title="アカウント作成" description="Pitviaへようこそ">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* API通信エラーの表示 */}
          {apiError && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
              {apiError}
            </div>
          )}

          {/* ロール選択コンポーネント */}
          <FormField
            control={form.control}
            name="role"
            render={() => (
              <FormItem className="space-y-2">
                <RoleSelector value={currentRole} onChange={handleRoleChange} />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ユーザー名 / 会社名入力フィールド */}
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">
                  {currentRole === "SHOP" ? "会社名 / ショップ名" : "お名前"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={
                      currentRole === "SHOP" ? "○○自動車整備工場" : "山田 太郎"
                    }
                    className={inputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    className={inputClassName}
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
                  <PasswordInput
                    placeholder="8文字以上"
                    className={inputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 確認用パスワード入力フィールド */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">パスワード（確認）</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="パスワードを再入力"
                    className={inputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 利用規約同意チェックボックス */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(c) => setAgreeTerms(c === true)}
            />
            <FormLabel
              htmlFor="terms"
              className="text-sm text-muted-foreground cursor-pointer font-normal"
            >
              <Link href="#" className="text-primary hover:underline">
                利用規約
              </Link>{" "}
              と{" "}
              <Link href="#" className="text-primary hover:underline">
                プライバシーポリシー
              </Link>{" "}
              に同意します
            </FormLabel>
          </div>

          {/* 送信ボタン */}
          <Button
            type="submit"
            className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_-4px] shadow-primary/50 pt-1"
            disabled={isLoading || !agreeTerms}
          >
            {isLoading ? (
              <span>処理中...</span>
            ) : (
              <>
                アカウントを作成
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="flex items-center gap-4 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">または</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          既にアカウントをお持ちですか？{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            ログイン
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
