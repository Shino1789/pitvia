import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { LoginSuccessToast } from "@/features/auth/components/success-toast";

/**
 * ログインページコンポーネント
 *
 * @component
 * @returns ログインページのJSX要素
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* LoginSuccessToast・LoginForm（内部のuseLoginフック）がuseSearchParamsに依存しており、
          ビルド時の静的プリレンダリングでCSR bailoutが発生しないようSuspenseで囲む */}
      <Suspense fallback={null}>
        <LoginSuccessToast />
        <LoginForm />
      </Suspense>
    </div>
  );
}
