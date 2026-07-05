"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { authSession } from "../services/auth-session";
import { LoginRequest } from "../types/auth";
import { ROUTES } from "@/shared/constants/routes";
import { ERROR_MESSAGES } from "@/shared/constants/messages";
import { ErrorResponse } from "@/shared/types/response";

/**
 * ログイン処理を行うカスタムフック
 *
 * @returns ログイン処理関数、ローディング状態、エラー状態
 */
export function useLogin() {
  // Next.jsのルーターを取得
  const router = useRouter();
  // クエリパラメータを取得
  const searchParams = useSearchParams();
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * ログイン処理
   *
   * @param data ログインリクエスト
   * @returns ログイン成否のフラグ
   */
  const login = async (data: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // ログイン認証処理実行
      await authSession.login(data);

      // クエリパラメータから callbackUrl を取得
      const callbackUrl = searchParams.get("callbackUrl");

      // リダイレクト先のURLを決定。callbackUrlが存在しない場合はダッシュボードに遷移
      const redirectUrl = callbackUrl ?? ROUTES.DASHBOARD;

      // 外部サイトへの不正リダイレクトを防ぐため、遷移先が自ドメイン内の相対パスであることを保証
      const safeRedirectUrl = redirectUrl.startsWith("/")
        ? redirectUrl
        : ROUTES.DASHBOARD;

      // 履歴ループを防ぐため、pushではなくreplaceで遷移
      router.replace(safeRedirectUrl);

      return true;
    } catch (e) {
      // Axiosのエラーの場合、エラーメッセージを取得してstateにセットする
      if (axios.isAxiosError<ErrorResponse>(e)) {
        const message = e.response?.data?.error?.message;
        if (message) {
          setError(message);
          setIsLoading(false);
          return false;
        }
      }

      // Axiosのエラーでない場合、通信エラーとしてエラーメッセージをセットする
      setError(ERROR_MESSAGES.NETWORK);
      setIsLoading(false);
      return false;
    }
  };

  return { login, isLoading, error };
}
