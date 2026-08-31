"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { dashboardQueries } from "../queries/dashboard-queries";

/**
 * ダッシュボード初期情報を取得・管理するカスタムフック
 *
 * @returns React Queryのクエリ結果オブジェクト (data, error, isPending, refetch等)
 */
export function useDashboard() {
  // ログイン中のユーザー情報をストアから取得
  const user = useAuthStore((state) => state.user);

  return useQuery(dashboardQueries.summary(user?.userId));
}
