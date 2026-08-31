"use client";

import { useQuery } from "@tanstack/react-query";
import { maintenanceRecordQueries } from "../queries/maintenance-record-queries";

/**
 * 整備履歴詳細情報を取得・管理するカスタムフック
 *
 * @param maintenanceRecordId 整備履歴ID
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useMaintenanceRecordDetail(maintenanceRecordId: string) {
  return useQuery(maintenanceRecordQueries.detail(maintenanceRecordId));
}
