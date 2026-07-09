/**
 * 業務エラーコード定義
 */
export const ERROR_CODE = {
  /**
   * リフレッシュトークンが存在しない
   */
  NO_REFRESH_TOKEN: "NO_REFRESH_TOKEN",

  /**
   * リフレッシュトークンが不正
   */
  INVALID_REFRESH_TOKEN: "INVALID_REFRESH_TOKEN",
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
