import { queryOptions } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";
import { dashboardKeys } from "../constants/dashboard-keys";
import type { DashboardChartParam } from "../types/dashboard";

/** キャッシュ維持時間定数 */
const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

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
      staleTime: ONE_MINUTE,
      gcTime: FIVE_MINUTES,
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
      staleTime: ONE_MINUTE,
      gcTime: FIVE_MINUTES,
    }),
};
