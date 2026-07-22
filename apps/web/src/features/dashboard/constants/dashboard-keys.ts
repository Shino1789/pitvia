import type { DashboardChartParam } from "../types/dashboard";

/**
 * ダッシュボード用 Query Key
 */
export const dashboardKeys = {
  /** ダッシュボード全体 */
  all: ["dashboard"] as const,

  /** ダッシュボード初期情報 */
  summary: ["dashboard", "summary"] as const,

  /** グラフ */
  chart: (params: DashboardChartParam) =>
    ["dashboard", "chart", params] as const,
};
