import { queryOptions } from "@tanstack/react-query";
import { customerApi } from "../api/customer-api";
import { customerKeys } from "../constants/customer-keys";
import type { CustomerListParams } from "../types/customer";

/**
 * 顧客機能用 Query Options 定義
 */
export const customerQueries = {
  /**
   * 顧客一覧 Query Options
   *
   * @param params 絞り込み・ページング条件
   */
  list: (params: CustomerListParams) =>
    queryOptions({
      queryKey: customerKeys.list(params),
      queryFn: () => customerApi.getList(params),
    }),
};
