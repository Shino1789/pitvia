import { MaintenanceRecordListSkeleton } from "@/features/maintenance-record/components/maintenance-record-list-skeleton";

/**
 * 整備履歴一覧画面の遷移時用ローディング
 *
 * @returns 整備履歴一覧スケルトンコンポーネント
 */
export default function MaintenancesLoading() {
  return <MaintenanceRecordListSkeleton />;
}
