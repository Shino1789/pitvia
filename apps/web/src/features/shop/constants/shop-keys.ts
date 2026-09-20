import type { ShopListParams } from "../types/shop";

/**
 * ショップ機能用 Query Key
 */
export const shopKeys = {
  /** ショップ機能全体 */
  all: ["shop"] as const,

  /** 招待コード */
  inviteCode: () => [...shopKeys.all, "invite-code"] as const,

  /**
   * ショップ一覧（条件を問わないprefix）
   *
   * ショップ連携成功後など、絞り込み・ページング条件に関わらず全ての一覧キャッシュを
   * 無効化する際に使用する。
   */
  lists: () => [...shopKeys.all, "list"] as const,

  /**
   * ショップ一覧
   *
   * 一覧取得結果に影響する条件（keyword/page/size）をすべてキーに含める。
   *
   * @param params 絞り込み・ページング条件
   */
  list: (params: ShopListParams) => [...shopKeys.lists(), params] as const,
};
