import { User } from "../../../shared/types/user";
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
 * ログインレスポンス
 * Spring: LoginResponse
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
}

/**
 * リフレッシュレスポンス
 * Spring: RefreshTokenResponse
 */
export interface RefreshTokenResponse {
  user: User;
  accessToken: string;
}
