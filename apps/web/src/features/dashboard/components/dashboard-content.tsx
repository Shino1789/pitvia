"use client";

import { ErrorState } from "@/shared/components/state/error-state";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { OwnerDashboard } from "@/features/dashboard/components/owner-dashboard";
import { ShopDashboard } from "@/features/dashboard/components/shop-dashboard";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type {
  OwnerDashboardResponse,
  ShopDashboardResponse,
} from "@/features/dashboard/types/dashboard";
import { getMenuLabel } from "@/shared/constants/menu";
import { ROUTES } from "@/shared/constants/routes";
import { USER_ROLE } from "@/shared/constants/role";
import { useHeader } from "@/shared/hooks/use-header";
import { useAuthStore } from "@/stores/auth-store";

/**
 * ダッシュボード表示用メインコンテンツコンポーネント
 *
 * @component
 * @returns ダッシュボードコンテンツのJSX要素
 */
export function DashboardContent() {
  // ストアからログインユーザー情報を取得
  const user = useAuthStore((state) => state.user);
  // ダッシュボード初期化カスタムフックから状態と関数を取得
  const { data, isPending, isError, refetch } = useDashboard();

  // 動的ヘッダーにタイトルを登録
  useHeader({ title: getMenuLabel(ROUTES.DASHBOARD) });

  // データ取得中はスケルトンUIを表示
  if (isPending) {
    return <DashboardSkeleton />;
  }

  // データの取得に失敗した場合
  if (isError || !data) {
    return <ErrorState onRetry={refetch} />;
  }

  // ログインユーザーのロールに応じた判定 & 型キャストしてコンポーネントへ渡す
  if (user?.role === USER_ROLE.SHOP && "maintenanceCountChart" in data) {
    return <ShopDashboard data={data as ShopDashboardResponse} />;
  }

  return <OwnerDashboard data={data as OwnerDashboardResponse} />;
}
