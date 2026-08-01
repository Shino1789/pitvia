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

/**
 * グラフ軸のスケール計算用設定定数
 *
 * - defaultMax: データの最大値がこの値以下の時に採用されるデフォルトの上限値
 * - step: defaultMax を超えた際に切り上げて追加していくステップ幅
 */
export const DASHBOARD_AXIS_CONFIG = {
  currency: {
    monthly: { defaultMax: 500_000, step: 500_000 }, // 月次: 50万円刻み（初期50万円）
    yearly: { defaultMax: 1_000_000, step: 500_000 }, // 年次: 50万円刻み（初期100万円）
  },
  count: {
    monthly: { defaultMax: 50, step: 50 }, // 月次: 50件刻み（初期50件）
    yearly: { defaultMax: 100, step: 50 }, // 年次: 50件刻み（初期100件）
  },
} as const;
