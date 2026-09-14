/**
 * ショップ招待コード
 * Spring: ShopInviteCodeResponse
 */
export interface ShopInviteCode {
  code: string;
  /** ISO-8601形式の有効期限日時文字列 */
  expiresAt: string;
}
