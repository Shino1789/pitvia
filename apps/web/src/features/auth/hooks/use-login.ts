"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth-api";
import { LoginRequest } from "../types/auth";
import { ErrorResponse } from "@/shared/types/response";

export function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      // apiFetchの仕様により、2xx系（成功）のときだけ response が戻る
      const response = await authApi.login(data);

      // response.data には LoginResponse (userId, userName, role, accessToken) が型安全に入っています
      console.log("Login success:", response.data);

      // クッキーやローカルストレージへのトークン保存、認証コンテキストへの反映などは
      // 必要に応じてここ（または apiFetch 内のインターセプター）で行います

      router.push("/dashboard"); // ログイン後のダッシュボードへ遷移
      return true;
    } catch (e) {
      // サーバー側（Spring Boot）から throw された ErrorResponse を型安全にハンドリング
      const errorResponse = e as ErrorResponse;

      if (errorResponse?.error?.message) {
        setError(errorResponse.error.message);
      } else {
        setError("通信エラーが発生しました。時間をおいて再度お試しください。");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
