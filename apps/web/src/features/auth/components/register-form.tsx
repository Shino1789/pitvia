"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { RoleSelector } from "./role-selector";
import { PasswordInput } from "./password-input";
import { useRegister } from "../hooks/use-register";
import { USER_ROLE } from "@/shared/constants/role";
import { ROUTES } from "@/shared/constants/routes";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/register.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";

/**
 * 新規ユーザー登録フォームコンポーネント
 *
 * @component
 */
export function RegisterForm() {
  // アカウント登録処理カスタムフックから状態と関数を取得
  const {
    register: submitRegister,
    isLoading,
    error: apiError,
  } = useRegister();

  // フォームバリデーションスキーマの初期化
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: USER_ROLE.OWNER,
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  // 選択されているユーザーロールをリアルタイム監視（入力ラベルの切り替え用）
  const currentRole = useWatch({
    control: form.control,
    name: "role",
  });

  // 利用規約チェックボックスの同意状態をリアルタイム監視（送信ボタンの非活性制御用）
  const isAccepted = useWatch({
    control: form.control,
    name: "agreeTerms",
  });

  /**
   * フォーム送信時のイベントハンドラー
   *
   * @param data バリデーション済みのフォーム入力値
   */
  const onSubmit = async (data: RegisterFormValues) => {
    await submitRegister(data);
  };

  return (
    <AuthLayout title="アカウント作成" description="Pitviaへようこそ">
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

          {/* ロール選択（ユーザー種別）フィールド */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <RoleSelector value={field.value} onChange={field.onChange} />
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
                  {currentRole === USER_ROLE.SHOP
                    ? "会社名 / ショップ名"
                    : "お名前"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={
                      currentRole === USER_ROLE.SHOP
                        ? "○○自動車整備工場"
                        : "山田 太郎"
                    }
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
                  <PasswordInput placeholder="8文字以上" {...field} />
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
                  <PasswordInput placeholder="パスワードを再入力" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 利用規約同意チェックボックス */}
          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center gap-2 pt-1">
                  <FormControl>
                    <Checkbox
                      id="terms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel
                    htmlFor="terms"
                    className="text-sm text-muted-foreground cursor-pointer font-normal"
                  >
                    <Link
                      href={ROUTES.TERMS}
                      className="text-primary hover:underline"
                    >
                      利用規約
                    </Link>{" "}
                    と{" "}
                    <Link
                      href={ROUTES.PRIVACY}
                      className="text-primary hover:underline"
                    >
                      プライバシーポリシー
                    </Link>{" "}
                    に同意します
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 送信ボタン */}
          <Button
            type="submit"
            className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_-4px] shadow-primary/50 pt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            disabled={isLoading || !isAccepted}
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

      {/* 区切り線 */}
      <div className="flex items-center gap-4 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">または</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* フッターリンク（ログインへの導線） */}
      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          既にアカウントをお持ちですか？{" "}
          <Link
            href={ROUTES.LOGIN}
            className="text-primary hover:underline font-medium"
          >
            ログイン
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
