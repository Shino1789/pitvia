/**
 * ダッシュボードグラフ種別
 * Spring: DashboardChartType
 */
export const DASHBOARD_CHART_TYPE = {
  /** 整備費用推移（オーナー用） */
  MAINTENANCE_COST_TREND: "MAINTENANCE_COST_TREND",
  /** 整備件数推移（ショップ用） */
  MAINTENANCE_COUNT_TREND: "MAINTENANCE_COUNT_TREND",
} as const;

export type DashboardChartType =
  (typeof DASHBOARD_CHART_TYPE)[keyof typeof DASHBOARD_CHART_TYPE];
