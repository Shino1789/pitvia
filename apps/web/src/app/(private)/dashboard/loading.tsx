import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";

/**
 * ダッシュボード画面の遷移時用ローディング
 *
 * @returns ダッシュボードスケルトンコンポーネント
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
