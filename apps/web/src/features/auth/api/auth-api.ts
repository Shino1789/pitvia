import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse } from "@/shared/types/response";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenResponse,
} from "@/features/auth/types/auth";

/**
 * 認証系APIクライアント
 */
export const authApi = {
  /**
   * ログイン認証APIリクエスト
   *
   * @param body ログインリクエスト
   * @returns APIレスポンス
   */
  login: (body: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>(ENDPOINTS.auth.login, body),

  /**
   * アカウント登録APIリクエスト
   *
   * @param body アカウント登録リクエスト
   * @returns APIレスポンス
   */
  register: (body: RegisterRequest) =>
    apiClient.post<ApiResponse<void>>(ENDPOINTS.auth.register, body),

  /**
   * ログアウトAPIリクエスト
   *
   * @returns APIレスポンス
   */
  logout: () => apiClient.post<ApiResponse<void>>(ENDPOINTS.auth.logout),

  /**
   * トークンのリフレッシュAPIリクエスト
   *
   * @returns APIレスポンス
   */
  refresh: () =>
    apiClient.post<ApiResponse<RefreshTokenResponse>>(ENDPOINTS.auth.refresh),
};
