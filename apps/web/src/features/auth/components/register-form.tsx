"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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

export function RegisterForm() {
  const {
    register: submitRegister,
    isLoading,
    error: apiError,
  } = useRegister();
  const [agreeTerms, setAgreeTerms] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "OWNER",
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const currentRole = useWatch({
    control,
    name: "role",
  });

  /** ロール選択が変更された際のハンドラー */
  const handleRoleChange = (role: UserRole) => {
    setValue("role", role, { shouldValidate: true });
  };

  /**
   * フォーム送信時のハンドラー
   * バリデーションおよびパスワード一致検証を通過した安全なデータのみが渡される
   *
   * @param data フォームの入力値
   */
  const onSubmit = async (data: RegisterFormValues) => {
    // 利用規約の同意チェック（チェックされていない場合は処理を中断）
    if (!agreeTerms) return;

    await submitRegister({
      role: data.role,
      userName: data.userName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  return (
    <AuthLayout title="アカウント作成" description="Pitviaへようこそ">
      {/* handleSubmit で onSubmit をラップ。noValidate でブラウザ標準検証を無効化 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* API通信エラーの表示 */}
        {apiError && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
            {apiError}
          </div>
        )}

        {/* ロール選択コンポーネントの繋ぎ込み */}
        <RoleSelector value={currentRole} onChange={handleRoleChange} />
        {errors.role && (
          <p className="text-xs text-destructive mt-1">{errors.role.message}</p>
        )}

        {/* ユーザー名 / 会社名入力フィールド */}
        <div className="space-y-2">
          <Label htmlFor="userName" className="text-sm">
            {currentRole === "SHOP" ? "会社名 / ショップ名" : "お名前"}
          </Label>
          <Input
            id="userName"
            type="text"
            placeholder={
              currentRole === "SHOP" ? "○○自動車整備工場" : "山田 太郎"
            }
            className="bg-input border-border"
            {...register("userName")} // React Hook Form への登録
          />
          {errors.userName && (
            <p className="text-xs text-destructive mt-1">
              {errors.userName.message}
            </p>
          )}
        </div>

        {/* メールアドレス入力フィールド */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">
            メールアドレス
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            className="bg-input border-border"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* パスワード入力フィールド */}
        <div className="space-y-2">
          <PasswordInput
            id="password"
            placeholder="8文字以上"
            {...register("password")} // forwardRef を経由した自動 ref バインド
          />
          {errors.password && (
            <p className="text-xs text-destructive mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* 確認用パスワード入力フィールド */}
        <div className="space-y-2">
          <PasswordInput
            id="confirmPassword"
            label="パスワード（確認）"
            placeholder="パスワードを再入力"
            {...register("confirmPassword")}
          />
          {/* Zod の refine((data) => data.password === data.confirmPassword) の結果がここに届く */}
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* 利用規約同意チェックボックス */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="terms"
            checked={agreeTerms}
            onCheckedChange={(c) => setAgreeTerms(c === true)}
          />
          <Label
            htmlFor="terms"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            <Link href="#" className="text-primary hover:underline">
              利用規約
            </Link>{" "}
            と{" "}
            <Link href="#" className="text-primary hover:underline">
              プライバシーポリシー
            </Link>{" "}
            に同意します
          </Label>
        </div>

        {/* 送信ボタン */}
        <Button
          type="submit"
          className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_-4px] shadow-primary/50"
          disabled={isLoading || !agreeTerms} // 規約未同意時は押せないように制御して堅牢性をアップ
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
