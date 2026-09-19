import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse, PageResponse } from "@/shared/types/response";
import type {
  ShopInviteCode,
  ShopLinkRequest,
  ShopLinkResponse,
  ShopListParams,
  ShopSummary,
} from "../types/shop";

/**
 * ショップ系APIクライアント
 */
export const shopApi = {
  /**
   * 連携済みショップ一覧取得APIリクエスト（OWNER専用）
   *
   * @param params 絞り込み・ページング条件
   * @returns ショップ一覧レスポンス（ページング付き）
   */
  getList: async (
    params: ShopListParams,
  ): Promise<PageResponse<ShopSummary>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<ShopSummary>>>(
      ENDPOINTS.shop.list,
      { params },
    );
    return response.data.data;
  },

  /**
   * 招待コード入力によるショップ連携APIリクエスト（OWNER専用）
   *
   * @param data 連携対象の車両IDと招待コード
   * @returns 作成された連携情報
   */
  link: async (data: ShopLinkRequest): Promise<ShopLinkResponse> => {
    const response = await apiClient.post<ApiResponse<ShopLinkResponse>>(
      ENDPOINTS.shop.link,
      data,
    );
    return response.data.data;
  },

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
