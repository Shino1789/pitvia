/**
 * 整備種別
 * Spring: MaintenanceType
 */
export const MAINTENANCE_TYPE = {
  PERIODIC_MAINTENANCE: "PERIODIC_MAINTENANCE",
  VEHICLE_INSPECTION: "VEHICLE_INSPECTION",
  INSPECTION: "INSPECTION",
  REPAIR: "REPAIR",
  CUSTOM: "CUSTOM",
  TUNING: "TUNING",
  SETTING: "SETTING",
  OTHER: "OTHER",
} as const;

export type MaintenanceType =
  (typeof MAINTENANCE_TYPE)[keyof typeof MAINTENANCE_TYPE];

/**
 * 整備種別の表示用ラベルマップ
 */
export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  [MAINTENANCE_TYPE.PERIODIC_MAINTENANCE]: "定期メンテナンス",
  [MAINTENANCE_TYPE.VEHICLE_INSPECTION]: "車検",
  [MAINTENANCE_TYPE.INSPECTION]: "点検",
  [MAINTENANCE_TYPE.REPAIR]: "修理",
  [MAINTENANCE_TYPE.CUSTOM]: "カスタム",
  [MAINTENANCE_TYPE.TUNING]: "チューニング",
  [MAINTENANCE_TYPE.SETTING]: "セッティング",
  [MAINTENANCE_TYPE.OTHER]: "その他",
};

/**
 * 整備種別ごとのバッジ配色（整備履歴一覧と共通）
 * 一覧・ダッシュボードで同一の色を使うための単一のソース。
 */
export const MAINTENANCE_TYPE_BADGE_CLASS: Record<MaintenanceType, string> = {
  [MAINTENANCE_TYPE.PERIODIC_MAINTENANCE]: "bg-emerald-500/20 text-emerald-400",
  [MAINTENANCE_TYPE.VEHICLE_INSPECTION]: "bg-blue-500/20 text-blue-400",
  [MAINTENANCE_TYPE.INSPECTION]: "bg-blue-500/20 text-blue-400",
  [MAINTENANCE_TYPE.REPAIR]: "bg-amber-500/20 text-amber-400",
  [MAINTENANCE_TYPE.CUSTOM]: "bg-primary/20 text-primary",
  [MAINTENANCE_TYPE.TUNING]: "bg-primary/20 text-primary",
  [MAINTENANCE_TYPE.SETTING]: "bg-violet-500/20 text-violet-400",
  [MAINTENANCE_TYPE.OTHER]: "bg-secondary text-muted-foreground",
};

/** グラフのツールチップ内訳で使うカテゴリ別カラー */
export const MAINTENANCE_TYPE_CHART_COLOR: Record<MaintenanceType, string> = {
  [MAINTENANCE_TYPE.PERIODIC_MAINTENANCE]: "#34d399",
  [MAINTENANCE_TYPE.VEHICLE_INSPECTION]: "#60a5fa",
  [MAINTENANCE_TYPE.INSPECTION]: "#38bdf8",
  [MAINTENANCE_TYPE.REPAIR]: "#fbbf24",
  [MAINTENANCE_TYPE.CUSTOM]: "#22d3ee",
  [MAINTENANCE_TYPE.TUNING]: "#818cf8",
  [MAINTENANCE_TYPE.SETTING]: "#e879f9",
  [MAINTENANCE_TYPE.OTHER]: "#94a3b8",
};
