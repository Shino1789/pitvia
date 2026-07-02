import { UserRole } from "@/shared/constants/role";

/**
 * ログインリクエスト
 * Spring: LoginRequest
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * アカウント登録リクエスト
 * Spring: RegisterRequest
 */
export interface RegisterRequest {
  role: UserRole;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * リフレッシュトークンリクエスト
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * ログインレスポンス
 * Spring: LoginResponse
 */
export interface LoginResponse {
  userId: string;
  userName: string;
  role: UserRole;
  accessToken: string;
}

/**
 * リフレッシュレスポンス
 * Spring: RefreshTokenResponse
 */
export interface RefreshTokenResponse {
  accessToken: string;
}
