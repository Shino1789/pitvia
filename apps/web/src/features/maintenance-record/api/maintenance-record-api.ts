import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse } from "@/shared/types/response";
import type {
  CreateMaintenanceRecordRequest,
  MaintenanceRecordDetail,
  MaintenanceRecordListParams,
  MaintenanceRecordListResponse,
  UpdateMaintenanceRecordRequest,
} from "@/features/maintenance-record/types/maintenance-record";

/**
 * 整備履歴登録・更新リクエストと作業項目ごとの画像ファイルから、API送信用のマルチパートリクエスト（FormData）を作成する
 *
 * 作業項目ごとの画像は `workItemImage_{index}`（`index`はworkItems配列のインデックス、0始まり）という名前のパートで送信する。
 *
 * @param data           整備履歴登録・更新リクエスト
 * @param workItemImages 作業項目のインデックスをキーとした画像ファイルのMap
 * @returns 送信用のFormData
 */
function buildMaintenanceRecordFormData(
  data: CreateMaintenanceRecordRequest | UpdateMaintenanceRecordRequest,
  workItemImages: Map<number, File>,
): FormData {
  const formData = new FormData();

  // JSON部分をBlobとして詰める（Content-Type: application/json を明示）
  formData.append(
    "request",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );

  workItemImages.forEach((file, index) => {
    formData.append(`workItemImage_${index}`, file);
  });

  return formData;
}

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

  /**
   * 整備履歴登録APIリクエスト
   *
   * @param data           整備履歴登録リクエスト
   * @param workItemImages 作業項目のインデックスをキーとした画像ファイルのMap（画像なしの作業項目は含めない）
   */
  register: async (
    data: CreateMaintenanceRecordRequest,
    workItemImages: Map<number, File>,
  ): Promise<void> => {
    await apiClient.post(
      ENDPOINTS.maintenanceRecord.list,
      buildMaintenanceRecordFormData(data, workItemImages),
    );
  },

  /**
   * 整備履歴詳細取得APIリクエスト
   *
   * @param maintenanceRecordId 整備履歴ID
   * @returns 整備履歴詳細情報
   */
  getDetail: async (
    maintenanceRecordId: string,
  ): Promise<MaintenanceRecordDetail> => {
    const response = await apiClient.get<ApiResponse<MaintenanceRecordDetail>>(
      ENDPOINTS.maintenanceRecord.byId(maintenanceRecordId),
    );
    return response.data.data;
  },

  /**
   * 整備履歴更新APIリクエスト
   *
   * @param maintenanceRecordId 整備履歴ID
   * @param data                整備履歴更新リクエスト
   * @param workItemImages      作業項目のインデックスをキーとした差し替え画像ファイルのMap
   *                            （画像を変更しない作業項目は含めない）
   */
  update: async (
    maintenanceRecordId: string,
    data: UpdateMaintenanceRecordRequest,
    workItemImages: Map<number, File>,
  ): Promise<void> => {
    await apiClient.put(
      ENDPOINTS.maintenanceRecord.byId(maintenanceRecordId),
      buildMaintenanceRecordFormData(data, workItemImages),
    );
  },

  /**
   * 整備履歴削除APIリクエスト
   *
   * @param maintenanceRecordId 整備履歴ID
   */
  remove: async (maintenanceRecordId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.maintenanceRecord.byId(maintenanceRecordId));
  },
};
