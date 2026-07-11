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
      <LoginSuccessToast />
      <LoginForm />
    </div>
  );
}
