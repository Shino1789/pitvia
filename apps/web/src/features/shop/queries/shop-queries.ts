import { queryOptions } from "@tanstack/react-query";
import { shopApi } from "../api/shop-api";
import { shopKeys } from "../constants/shop-keys";
import type { ShopListParams } from "../types/shop";

/**
 * ショップ機能用 Query Options 定義
 */
export const shopQueries = {
  /**
   * 連携済みショップ一覧 Query Options
   *
   * @param params 絞り込み・ページング条件
   */
  list: (params: ShopListParams) =>
    queryOptions({
      queryKey: shopKeys.list(params),
      queryFn: () => shopApi.getList(params),
    }),

  /**
   * 現在有効な招待コード Query Options
   */
  inviteCode: () =>
    queryOptions({
      queryKey: shopKeys.inviteCode(),
      queryFn: () => shopApi.getInviteCode(),
    }),
};
