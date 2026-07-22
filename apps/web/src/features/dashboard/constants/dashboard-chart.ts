/**
 * ダッシュボードグラフ種別
 * Spring: DashboardChartType
 */
export const DASHBOARD_CHART_TYPE = {
  MAINTENANCE_COST_TREND: "MAINTENANCE_COST_TREND",
  MAINTENANCE_COUNT_TREND: "MAINTENANCE_COUNT_TREND",
} as const;

export type DashboardChartType =
  (typeof DASHBOARD_CHART_TYPE)[keyof typeof DASHBOARD_CHART_TYPE];
