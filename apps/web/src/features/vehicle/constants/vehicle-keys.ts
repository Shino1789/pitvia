/**
 * 車両機能用 Query Key
 */
export const vehicleKeys = {
  /** 車両機能全体 */
  all: ["vehicle"] as const,

  /** 車両登録フォームの選択肢 */
  formOptions: (vehicleType: string) =>
    ["vehicle", "form-options", vehicleType] as const,

  /** 車両詳細 */
  detail: (vehicleId: string) => ["vehicle", "detail", vehicleId] as const,
};
