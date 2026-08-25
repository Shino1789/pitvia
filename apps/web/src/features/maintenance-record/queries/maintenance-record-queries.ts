import { queryOptions } from "@tanstack/react-query";
import { maintenanceRecordApi } from "../api/maintenance-record-api";
import { maintenanceRecordKeys } from "../constants/maintenance-record-keys";
import type { MaintenanceRecordListParams } from "../types/maintenance-record";

/**
 * 整備履歴機能用 Query Options 定義
 */
export const maintenanceRecordQueries = {
  /**
   * 整備履歴一覧 Query Options
   *
   * @param params 絞り込み・並び替え・ページング条件
   */
  list: (params: MaintenanceRecordListParams) =>
    queryOptions({
      queryKey: maintenanceRecordKeys.list(params),
      queryFn: () => maintenanceRecordApi.getList(params),
    }),

  /**
   * 整備履歴詳細 Query Options
   *
   * @param maintenanceRecordId 整備履歴ID
   */
  detail: (maintenanceRecordId: string) =>
    queryOptions({
      queryKey: maintenanceRecordKeys.detail(maintenanceRecordId),
      queryFn: () => maintenanceRecordApi.getDetail(maintenanceRecordId),
      // 整備履歴IDが確定している場合のみクエリを実行
      enabled: !!maintenanceRecordId,
    }),
};
