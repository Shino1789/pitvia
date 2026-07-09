// apps/web/src/app/(public)/register/page.tsx
"use client";

import { RegisterForm } from "@/features/auth/components/register-form";

/**
 * 新規アカウント作成ページコンポーネント
 *
 * @returns アカウント作成ページのJSX要素
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
