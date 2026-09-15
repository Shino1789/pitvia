import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse } from "@/shared/types/response";
import type { ShopInviteCode } from "../types/shop";

/**
 * ショップ系APIクライアント
 */
export const shopApi = {
  /**
   * 現在有効な招待コード取得APIリクエスト
   *
   * @returns 現在有効な招待コード（存在しない場合はnull）
   */
  getInviteCode: async (): Promise<ShopInviteCode | null> => {
    const response = await apiClient.get<ApiResponse<ShopInviteCode | null>>(
      ENDPOINTS.shop.inviteCode,
    );
    return response.data.data;
  },

  /**
   * 招待コード新規発行APIリクエスト
   *
   * 失効していない既存コードが存在する場合は、それを失効させたうえで新しいコードを発行する。
   *
   * @returns 新規発行された招待コード
   */
  issueInviteCode: async (): Promise<ShopInviteCode> => {
    const response = await apiClient.post<ApiResponse<ShopInviteCode>>(
      ENDPOINTS.shop.inviteCode,
    );
    return response.data.data;
  },
};
