import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse } from "@/shared/types/response";
import type {
  MaintenanceRecordListParams,
  MaintenanceRecordListResponse,
} from "@/features/maintenance-record/types/maintenance-record";

/**
 * 整備履歴系APIクライアント
 */
export const maintenanceRecordApi = {
  /**
   * 整備履歴一覧取得APIリクエスト
   *
   * @param params 絞り込み・並び替え・ページング条件
   * @returns 整備履歴一覧レスポンス（対象オーナー情報＋ページング付き一覧）
   */
  getList: async (
    params: MaintenanceRecordListParams,
  ): Promise<MaintenanceRecordListResponse> => {
    const response = await apiClient.get<
      ApiResponse<MaintenanceRecordListResponse>
    >(ENDPOINTS.maintenanceRecord.list, { params });
    return response.data.data;
  },
};
