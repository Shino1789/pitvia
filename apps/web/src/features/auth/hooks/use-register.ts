"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth-api";
import { RegisterRequest } from "../types/auth";
import { ErrorResponse } from "@/shared/types/response";

export function useRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      // apiFetchの型定義通り、成功時（2xx）のみ response が返ってくる
      const response = await authApi.register(data);

      console.log("Register success", response.meta); // 必要ならメタ情報を利用

      // 登録成功後はログイン画面へ移動
      router.push("/login?registered=true");
      return true;
    } catch (e) {
      // サーバー側でエラーを検知して throw された ErrorResponse かどうかを判定
      const errorResponse = e as ErrorResponse;

      if (errorResponse?.error?.message) {
        // バックエンド（Spring Boot）から返ってきたエラーメッセージを設定
        setError(errorResponse.error.message);
      } else {
        // ネットワーク切断などの予期せぬ通信エラー
        setError("通信エラーが発生しました。時間をおいて再度お試しください。");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
}
