import { MaintenanceRecordFormSkeleton } from "@/features/maintenance-record/components/maintenance-record-form-skeleton";

/**
 * 整備履歴詳細画面の遷移時用ローディング
 *
 * @returns 整備履歴フォームスケルトンコンポーネント
 */
export default function MaintenanceRecordDetailLoading() {
  return <MaintenanceRecordFormSkeleton />;
}
