"use client";

import { useAuthStore } from "@/stores/auth-store";
import { authSession } from "@/features/auth/services/auth-session";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await authSession.logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              ダッシュボード
            </h1>
            <p className="text-muted-foreground">Pitvia 認証検証用スペース</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>

        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            現在のログインセッション情報
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-muted-foreground">お名前:</span>{" "}
              {user?.userName || "未取得"}
            </p>
            <p>
              <span className="font-medium text-muted-foreground">
                メールアドレス:
              </span>{" "}
              {user?.email || "未取得"}
            </p>
            <p>
              <span className="font-medium text-muted-foreground">ロール:</span>{" "}
              {user?.role || "未取得"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
