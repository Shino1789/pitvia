"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { maintenanceRecordQueries } from "../queries/maintenance-record-queries";
import type { MaintenanceRecordListParams } from "../types/maintenance-record";

/**
 * 整備履歴一覧を取得・管理するカスタムフック
 *
 * @param params 絞り込み・並び替え・ページング条件
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useMaintenanceRecordList(params: MaintenanceRecordListParams) {
  return useQuery({
    ...maintenanceRecordQueries.list(params),
    placeholderData: keepPreviousData,
  });
}
