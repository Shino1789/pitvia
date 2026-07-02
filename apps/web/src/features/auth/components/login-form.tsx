"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { PasswordInput } from "./password-input";
import { useLogin } from "../hooks/use-login";

export function LoginForm() {
  const { login, isLoading, error } = useLogin();
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <AuthLayout title="Pitvia" description="走るクルマのための整備記録">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
            {error}
          </div>
        )}

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
          value={formData.password}
          onChange={handleInputChange}
          required
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(c) => setRememberMe(c === true)}
          />
          <Label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            ログイン状態を保持する
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
              ログイン
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

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
