"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { DashboardChartParam } from "../types/dashboard";
import { PERIOD_TYPE } from "@/shared/constants/period";
import { dashboardQueries } from "../queries/dashboard-queries";

/** デフォルトのグラフ取得パラメータ (月次集計) */
const DEFAULT_PARAMS: DashboardChartParam = {
  period: PERIOD_TYPE.MONTH,
};

/**
 * ダッシュボードグラフデータを取得・管理するカスタムフック
 *
 * @param initialParams 初期表示時のクエリパラメータ (省略時は月次)
 * @returns グラフのクエリ結果、現在のパラメータ、パラメータ変更用関数
 */
export function useDashboardChart(
  initialParams: DashboardChartParam = DEFAULT_PARAMS,
) {
  // ログイン中のユーザー情報をストアから取得
  const user = useAuthStore((state) => state.user);

  // グラフの集計条件パラメータを状態管理
  const [params, setParams] = useState<DashboardChartParam>(initialParams);

  // グラフデータの取得クエリ
  const queryResult = useQuery(dashboardQueries.chart(params, user?.userId));

  return {
    ...queryResult,
    /** 現在の集計パラメータ */
    params,
    /** 集計条件を変更する関数 */
    changeParams: setParams,
  };
}
