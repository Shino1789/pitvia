import { queryOptions } from "@tanstack/react-query";
import { shopApi } from "../api/shop-api";
import { shopKeys } from "../constants/shop-keys";

/**
 * ショップ機能用 Query Options 定義
 */
export const shopQueries = {
  /**
   * 現在有効な招待コード Query Options
   */
  inviteCode: () =>
    queryOptions({
      queryKey: shopKeys.inviteCode(),
      queryFn: () => shopApi.getInviteCode(),
    }),
};
