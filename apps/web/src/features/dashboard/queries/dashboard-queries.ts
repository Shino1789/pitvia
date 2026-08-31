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
   *
   * @param userId ログインユーザーID
   */
  summary: (userId?: string) =>
    queryOptions({
      queryKey: [...dashboardKeys.summary, userId],
      queryFn: dashboardApi.getDashboard,
      // ユーザーIDが存在する場合のみクエリを実行
      enabled: !!userId,
    }),

  /**
   * ダッシュボードグラフデータ Query Options
   *
   * @param params グラフ取得クエリパラメータ
   * @param userId ログインユーザーID
   */
  chart: (params: DashboardChartParam, userId?: string) =>
    queryOptions({
      queryKey: [...dashboardKeys.chart(params), userId],
      queryFn: () => dashboardApi.getChart(params),
      // ユーザーIDが存在する場合のみクエリを実行
      enabled: !!userId,
    }),
};
