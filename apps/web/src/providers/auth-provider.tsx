"use client";

import { LoadingScreen } from "@/shared/components/state/loading-screen";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { setupResponseInterceptor } from "@/lib/api/interceptor";
import { authSession } from "@/features/auth/services/auth-session";
import { ROUTES } from "@/shared/constants/routes";
import { AUTH_FAILURE_REASON } from "@/shared/constants/auth-failure";
import { ERROR_CODE } from "@/shared/constants/error-code";
import { useAuthStore } from "@/stores/auth-store";

/**
 * 認証セッションの復元を管理するプロバイダーコンポーネント
 *
 * @component
 * @param children 子コンポーネント
 * @returns 初期化完了時は子コンポーネント、初期化中はローディング画面のJSX
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // アプリケーションの初期化（認証復元）が完了したかどうかを判定するstate
  const [isInitialized, setIsInitialized] = useState(false);
  // Next.jsのルーターを取得
  const router = useRouter();
  // ストアから現在のアクセストークンの有無を取得
  const accessToken = useAuthStore((state) => state.accessToken);

  // APIレスポンスインターセプターのセットアップ
  useEffect(() => {
    setupResponseInterceptor();
  }, []);

  // アプリ起動時（保護ルート侵入時）の認証セッション復元処理
  useEffect(() => {
    const initializeAuth = async () => {
      // すでにメモリ上に認証情報が存在する場合は即座に初期化を完了させる
      if (accessToken) {
        setIsInitialized(true);
        return;
      }

      try {
        // アクセストークンを再取得してセッションを復元
        await authSession.restoreSession();

        // 復元成功の場合初期化を完了状態にする
        setIsInitialized(true);
      } catch (error) {
        // APIエラーの場合
        if (axios.isAxiosError(error)) {
          const code = error.response?.data?.error?.code;

          // 失敗した理由がリフレッシュトークンが存在しない（未ログイン）だった場合
          if (code === ERROR_CODE.NO_REFRESH_TOKEN) {
            router.replace(ROUTES.LOGIN);
            return;
          }

          // 失敗した理由がリフレッシュトークンの期限切れや改ざんの場合
          if (code === ERROR_CODE.INVALID_REFRESH_TOKEN) {
            router.replace(
              `${ROUTES.LOGIN}?reason=${AUTH_FAILURE_REASON.SESSION_EXPIRED}`,
            );
            return;
          }
        }
        // 予期せぬエラーでセッション復元に失敗した場合
        console.error("Unexpected error during auth initialization.", error);
        // TODO: ログイン画面にメッセージ付きで飛ばすのではなく、エラー画面に飛ばす方がいいかも(エラーページの実装が完了次第要検討)
        router.replace(`${ROUTES.LOGIN}?reason=${AUTH_FAILURE_REASON.NETWORK}`);
        return;
      }
    };

    initializeAuth();
  }, [router, accessToken]);

  // 初期化が完了するまでは、未ログイン判定による一瞬の画面チラつきを防ぐためローディング画面を表示
  if (!isInitialized) {
    return <LoadingScreen message="認証情報を確認しています..." />;
  }

  return <>{children}</>;
}
