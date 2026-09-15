/**
 * ショップ機能用 Query Key
 */
export const shopKeys = {
  /** ショップ機能全体 */
  all: ["shop"] as const,

  /** 招待コード */
  inviteCode: () => [...shopKeys.all, "invite-code"] as const,
};
