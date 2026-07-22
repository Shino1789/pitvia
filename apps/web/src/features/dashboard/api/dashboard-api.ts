import { ENDPOINTS } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/axios";
import type { ApiResponse } from "@/shared/types/response";
import type {
  DashboardChartParam,
  DashboardChartResponse,
  DashboardResponse,
} from "@/features/dashboard/types/dashboard";

/**
 * ダッシュボード系APIクライアント
 */
export const dashboardApi = {
  /**
   * ダッシュボード初期情報取得APIリクエスト
   *
   * @returns ユーザー権限に応じたダッシュボード情報
   */
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get<ApiResponse<DashboardResponse>>(
      ENDPOINTS.dashboard.root,
    );
    return response.data.data;
  },

  /**
   * ダッシュボードグラフデータ取得APIリクエスト
   *
   * @param params グラフ取得クエリパラメータ
   * @returns ユーザー権限に応じたグラフ表示用データ
   */
  getChart: async (
    params: DashboardChartParam,
  ): Promise<DashboardChartResponse> => {
    const response = await apiClient.get<ApiResponse<DashboardChartResponse>>(
      ENDPOINTS.dashboard.chart,
      { params },
    );
    return response.data.data;
  },
};
