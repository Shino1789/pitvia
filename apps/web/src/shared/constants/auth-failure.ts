import { ERROR_MESSAGES } from "../messages/error";

/**
 * 認証失敗の識別子（URLクエリパラメータ `?reason=` に指定する値）
 */
export const AUTH_FAILURE_REASON = {
  SESSION_EXPIRED: "session_expired",
  NETWORK: "network",
} as const;

/**
 * 認証失敗理由の型定義
 */
export type AuthFailureReason =
  (typeof AUTH_FAILURE_REASON)[keyof typeof AUTH_FAILURE_REASON];

/**
 * 認証失敗理由に対応する表示メッセージのマップ
 */
export const AUTH_FAILURE_MESSAGES: Record<AuthFailureReason, string> = {
  [AUTH_FAILURE_REASON.SESSION_EXPIRED]: ERROR_MESSAGES.SESSION_EXPIRED,
  [AUTH_FAILURE_REASON.NETWORK]: ERROR_MESSAGES.NETWORK,
};

/**
 * 値が有効な認証失敗理由であるかを判定する型ガード
 *
 * @param value 判定対象の文字列
 * @returns 認証失敗理由として有効な場合は true
 */
export const isAuthFailureReason = (
  value: string,
): value is AuthFailureReason => value in AUTH_FAILURE_MESSAGES;
