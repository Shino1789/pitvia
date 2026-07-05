"use client";

import { useEffect, useState } from "react";
import { setupResponseInterceptor } from "@/lib/api/interceptor";
import { authSession } from "@/features/auth/services/auth-session";

/**
 * アプリケーション全体のAPI初期化および認証セッションの復元を管理するプロバイダーコンポーネント
 *
 * @param children 子コンポーネント
 * @returns 初期化完了時は子コンポーネント、初期化中はローディング画面のJSX
 */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  // アプリケーションの初期化（認証復元）が完了したかどうかを判定するstate
  const [isInitialized, setIsInitialized] = useState(false);

  // APIレスポンスインターセプターのセットアップ
  useEffect(() => {
    setupResponseInterceptor();
  }, []);

  // アプリ起動時の認証セッション復元処理
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // クッキー（refresh_token）が存在すれば、自動でアクセストークンを再取得してセッションを復元
        await authSession.restoreSession();
      } catch (error) {
        // セッション復元に失敗（未ログイン、またはトークン期限切れ）した場合のログ出力
        console.error("Failed to restore auth session:", error);
      } finally {
        // 認証の成否（ログイン・未ログイン）に関わらず、初期化処理自体は完了したためフラグを確定する
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // 初期化が完了するまでは、未ログイン判定による一瞬の画面チラつきを防ぐためローディング画面を表示
  // TODO: ローディング画面はカスタマイズ要検討
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
