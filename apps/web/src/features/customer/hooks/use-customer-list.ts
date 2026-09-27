"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { customerQueries } from "../queries/customer-queries";
import type { CustomerListParams } from "../types/customer";

/**
 * 顧客一覧を取得・管理するカスタムフック
 *
 * @param params 絞り込み・ページング条件
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useCustomerList(params: CustomerListParams) {
  return useQuery({
    ...customerQueries.list(params),
    placeholderData: keepPreviousData,
  });
}
