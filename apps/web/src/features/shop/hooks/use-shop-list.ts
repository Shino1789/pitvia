"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { shopQueries } from "../queries/shop-queries";
import type { ShopListParams } from "../types/shop";

/**
 * 連携済みショップ一覧を取得・管理するカスタムフック（OWNER専用）
 *
 * @param params 絞り込み・ページング条件
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useShopList(params: ShopListParams) {
  return useQuery({
    ...shopQueries.list(params),
    placeholderData: keepPreviousData,
  });
}
