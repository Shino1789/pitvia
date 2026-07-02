import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiFetch } from "@/lib/api/client";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "@/features/auth/types/auth";

/**
 * 認証APIサービス
 */
export const authApi = {
  /**
   * ログインAPIリクエスト
   *
   * @param body リクエストボディ
   * @returns レスポンスオブジェクト
   */
  login: (body: LoginRequest) =>
    apiFetch<LoginResponse>(ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /**
   * アカウント作成APIリクエスト
   *
   * @param body リクエストボディ
   * @returns レスポンスオブジェクト
   */
  register: (body: RegisterRequest) =>
    apiFetch<void>(ENDPOINTS.auth.register, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
