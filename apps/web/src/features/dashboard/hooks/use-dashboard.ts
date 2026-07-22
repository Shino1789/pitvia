"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardQueries } from "../queries/dashboard-queries";

/**
 * ダッシュボード初期情報を取得・管理するカスタムフック
 *
 * @returns React Queryのクエリ結果オブジェクト (data, error, isPending, refetch等)
 */
export function useDashboard() {
  return useQuery(dashboardQueries.summary());
}
