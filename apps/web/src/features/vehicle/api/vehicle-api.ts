import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse } from "@/shared/types/response";
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleDetail,
  VehicleFormOptionsResponse,
} from "@/features/vehicle/types/vehicle";

/**
 * リクエストJSONと画像ファイルから、API送信用のマルチパートリクエスト（FormData）を作成する
 *
 * @param data  車両登録・更新リクエスト
 * @param image 車両画像ファイル（未選択の場合はnull）
 * @returns 送信用のFormData
 */
function buildVehicleFormData(
  data: CreateVehicleRequest | UpdateVehicleRequest,
  image: File | null,
): FormData {
  const formData = new FormData();

  // JSON部分をBlobとして詰める（Content-Type: application/json を明示）
  formData.append(
    "request",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );

  // 画像が選択されている場合のみファイルパートを追加
  if (image) {
    formData.append("file", image);
  }

  return formData;
}

/**
 * 車両系APIクライアント
 */
export const vehicleApi = {
  /**
   * 車両登録フォームの選択肢取得APIリクエスト
   *
   * @param vehicleType 対象の車両種別（現状は"CAR"固定）
   * @returns フォーム選択肢一式
   */
  getFormOptions: async (
    vehicleType: string,
  ): Promise<VehicleFormOptionsResponse> => {
    const response = await apiClient.get<
      ApiResponse<VehicleFormOptionsResponse>
    >(ENDPOINTS.vehicle.formOptions, { params: { vehicleType } });
    return response.data.data;
  },

  /**
   * 車両登録APIリクエスト
   *
   * @param data  車両登録リクエスト
   * @param image 車両画像ファイル（任意）
   */
  register: async (
    data: CreateVehicleRequest,
    image: File | null,
  ): Promise<void> => {
    await apiClient.post(
      ENDPOINTS.vehicle.root,
      buildVehicleFormData(data, image),
    );
  },

  /**
   * 車両詳細取得APIリクエスト
   *
   * @param vehicleId 車両ID
   * @returns 車両詳細情報
   */
  getDetail: async (vehicleId: string): Promise<VehicleDetail> => {
    const response = await apiClient.get<ApiResponse<VehicleDetail>>(
      ENDPOINTS.vehicle.byId(vehicleId),
    );
    return response.data.data;
  },

  /**
   * 車両更新APIリクエスト
   *
   * @param vehicleId 車両ID
   * @param data      車両更新リクエスト
   * @param image     車両画像ファイル（未変更の場合はnull）
   */
  update: async (
    vehicleId: string,
    data: UpdateVehicleRequest,
    image: File | null,
  ): Promise<void> => {
    await apiClient.put(
      ENDPOINTS.vehicle.byId(vehicleId),
      buildVehicleFormData(data, image),
    );
  },

  /**
   * 車両削除APIリクエスト
   *
   * @param vehicleId 車両ID
   */
  remove: async (vehicleId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.vehicle.byId(vehicleId));
  },
};
