import { UserRole } from "@/shared/constants/role";

/**
 * ユーザー情報
 * Spring: UserResponse
 */
export interface User {
  userId: string;
  role: UserRole;
  userName: string;
  email: string;
  iconUrl: string | null;
}
