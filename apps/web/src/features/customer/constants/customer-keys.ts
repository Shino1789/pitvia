import type { CustomerListParams } from "../types/customer";

/**
 * 顧客機能用 Query Key
 */
export const customerKeys = {
  /** 顧客機能全体 */
  all: ["customer"] as const,

  /**
   * 顧客一覧
   *
   * 一覧取得結果に影響する条件（keyword/page/size）をすべてキーに含める。
   *
   * @param params 絞り込み・ページング条件
   */
  list: (params: CustomerListParams) =>
    [...customerKeys.all, "list", params] as const,
};
