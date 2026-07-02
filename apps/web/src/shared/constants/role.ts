/**
 * ユーザーロール一覧
 */
export const USER_ROLES = ["OWNER", "SHOP", "ADMIN"] as const;

/**
 * ユーザーロール
 */
export type UserRole = (typeof USER_ROLES)[number];
