/**
 * ダッシュボードグラフの集計単位
 * Spring: PeriodType
 */
export const PERIOD_TYPE = {
  MONTH: "MONTH",
  YEAR: "YEAR",
} as const;

export type PeriodType = (typeof PERIOD_TYPE)[keyof typeof PERIOD_TYPE];
