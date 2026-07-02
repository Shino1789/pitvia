"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { RoleSelector } from "./role-selector";
import { PasswordInput } from "./password-input";
import { useRegister } from "../hooks/use-register";
import { UserRole } from "@/shared/constants/role";

export function RegisterForm() {
  const { register, isLoading, error } = useRegister();
  const [accountType, setAccountType] = useState<UserRole>("OWNER");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (formData.password !== formData.confirmPassword) {
      setValidationError("パスワードが一致しません");
      return;
    }

    await register({
      role: accountType,
      userName: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
  };

  return (
    <AuthLayout title="アカウント作成" description="Pitviaへようこそ">
      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || validationError) && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
            {error || validationError}
          </div>
        )}

        <RoleSelector value={accountType} onChange={setAccountType} />

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">
            {accountType === "SHOP" ? "会社名 / ショップ名" : "お名前"}
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder={
              accountType === "SHOP" ? "○○自動車整備工場" : "山田 太郎"
            }
            value={formData.name}
            onChange={handleInputChange}
            className="bg-input border-border"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">
            メールアドレス
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleInputChange}
            className="bg-input border-border"
            required
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          placeholder="8文字以上"
          value={formData.password}
          onChange={handleInputChange}
          required
          minLength={8}
        />

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="パスワード（確認）"
          placeholder="パスワードを再入力"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          required
          minLength={8}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="terms"
            checked={agreeTerms}
            onCheckedChange={(c) => setAgreeTerms(c === true)}
            required
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

        <Button
          type="submit"
          className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_-4px] shadow-primary/50"
          disabled={isLoading}
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
