"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { authSession } from "../services/auth-session";
import { RegisterRequest } from "../types/auth";
import { ROUTES } from "@/shared/constants/routes";
import { ERROR_MESSAGES } from "@/shared/messages/error";
import { ErrorResponse } from "@/shared/types/response";

/**
 * 新規アカウント登録処理を行うカスタムフック
 *
 * @returns アカウント登録処理関数、ローディング状態、エラー状態
 */
export function useRegister() {
  // Next.jsのルーターを取得
  const router = useRouter();
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * アカウント登録処理
   *
   * @param data アカウント登録リクエスト
   * @returns 登録成否のフラグ
   */
  const register = async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // アカウント登録処理の実行
      await authSession.register(data);

      // ログイン画面へのリダイレクトURLを作成（登録完了フラグを付与）
      const targetUrl = `${ROUTES.LOGIN}?registered=true`;

      // 登録フォームへの「戻る」ループを防ぐため、replaceで遷移
      router.replace(targetUrl);

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

  return { register, isLoading, error };
}
