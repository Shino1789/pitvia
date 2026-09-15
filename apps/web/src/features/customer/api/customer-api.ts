import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse, PageResponse } from "@/shared/types/response";
import type { CustomerListParams, CustomerSummary } from "../types/customer";

/**
 * 顧客系APIクライアント
 */
export const customerApi = {
  /**
   * 顧客一覧取得APIリクエスト
   *
   * @param params 絞り込み・ページング条件
   * @returns 顧客一覧レスポンス（ページング付き）
   */
  getList: async (
    params: CustomerListParams,
  ): Promise<PageResponse<CustomerSummary>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<CustomerSummary>>>(
      ENDPOINTS.customer.list,
      { params },
    );
    return response.data.data;
  },
};
