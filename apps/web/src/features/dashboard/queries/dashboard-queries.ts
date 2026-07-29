import { queryOptions } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";
import { dashboardKeys } from "../constants/dashboard-keys";
import type { DashboardChartParam } from "../types/dashboard";

/**
 * ダッシュボード機能用 Query Options 定義
 */
export const dashboardQueries = {
  /**
   * ダッシュボード初期情報 Query Options
   */
  summary: () =>
    queryOptions({
      queryKey: dashboardKeys.summary,
      queryFn: dashboardApi.getDashboard,
    }),

  /**
   * ダッシュボードグラフデータ Query Options
   *
   * @param params グラフ取得クエリパラメータ
   */
  chart: (params: DashboardChartParam) =>
    queryOptions({
      queryKey: dashboardKeys.chart(params),
      queryFn: () => dashboardApi.getChart(params),
    }),
};
