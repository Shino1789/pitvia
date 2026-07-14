import { User } from "../../../shared/types/user";
import { UserRole } from "@/shared/constants/role";
import { LoginFormValues } from "../schemas/login.schema";

/**
 * ログインリクエスト
 * Spring: LoginRequest
 */
export type LoginRequest = LoginFormValues;

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
