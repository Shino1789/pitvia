/**
 * 整備カテゴリ
 * Spring: MaintenanceCategory（maintenance.enums.MaintenanceCategory）
 */
export const MAINTENANCE_CATEGORY = {
  ENGINE: "ENGINE",
  INTAKE_EXHAUST: "INTAKE_EXHAUST",
  COOLING: "COOLING",
  DRIVETRAIN: "DRIVETRAIN",
  SUSPENSION: "SUSPENSION",
  BRAKE: "BRAKE",
  ELECTRICAL: "ELECTRICAL",
  BODY: "BODY",
  INTERIOR: "INTERIOR",
  AIR_CONDITIONER: "AIR_CONDITIONER",
  BODY_REPAIR: "BODY_REPAIR",
  CLEANING: "CLEANING",
  OTHER: "OTHER",
} as const;

export type MaintenanceCategory =
  (typeof MAINTENANCE_CATEGORY)[keyof typeof MAINTENANCE_CATEGORY];

/**
 * 整備カテゴリの表示用ラベルマップ
 */
export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  [MAINTENANCE_CATEGORY.ENGINE]: "エンジン",
  [MAINTENANCE_CATEGORY.INTAKE_EXHAUST]: "吸排気",
  [MAINTENANCE_CATEGORY.COOLING]: "冷却",
  [MAINTENANCE_CATEGORY.DRIVETRAIN]: "駆動系",
  [MAINTENANCE_CATEGORY.SUSPENSION]: "足回り",
  [MAINTENANCE_CATEGORY.BRAKE]: "ブレーキ",
  [MAINTENANCE_CATEGORY.ELECTRICAL]: "電装",
  [MAINTENANCE_CATEGORY.BODY]: "外装",
  [MAINTENANCE_CATEGORY.INTERIOR]: "内装",
  [MAINTENANCE_CATEGORY.AIR_CONDITIONER]: "エアコン",
  [MAINTENANCE_CATEGORY.BODY_REPAIR]: "板金",
  [MAINTENANCE_CATEGORY.CLEANING]: "洗浄",
  [MAINTENANCE_CATEGORY.OTHER]: "その他",
};

/**
 * 整備カテゴリの選択肢一覧（Select用、表示順はsortOrder相当の定義順）
 */
export const MAINTENANCE_CATEGORY_OPTIONS: {
  value: MaintenanceCategory;
  label: string;
}[] = Object.values(MAINTENANCE_CATEGORY).map((value) => ({
  value,
  label: MAINTENANCE_CATEGORY_LABELS[value],
}));
