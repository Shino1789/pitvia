/**
 * ユーザーロール定数
 */
export const USER_ROLE = {
  OWNER: "OWNER",
  SHOP: "SHOP",
  ADMIN: "ADMIN",
} as const;

/**
 * ユーザーロールの型定義
 */
export type UserRole = keyof typeof USER_ROLE;

/**
 * Zodのenumなどで使うための配列
 */
export const USER_ROLES = Object.values(USER_ROLE) as [UserRole, ...UserRole[]];
