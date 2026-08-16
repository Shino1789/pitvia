import type { MaintenanceRecordListParams } from "../types/maintenance-record";

/**
 * 整備履歴機能用 Query Key
 */
export const maintenanceRecordKeys = {
  /** 整備履歴機能全体 */
  all: ["maintenance-record"] as const,

  /**
   * 整備履歴一覧
   *
   * 一覧取得結果に影響する条件（vehicleId/ownerId/maintenanceType/keyword/sort/page/size）を
   * すべてキーに含める。
   *
   * @param params 絞り込み・並び替え・ページング条件
   */
  list: (params: MaintenanceRecordListParams) =>
    [...maintenanceRecordKeys.all, "list", params] as const,
};
