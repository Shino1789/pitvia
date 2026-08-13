import { VehicleListSkeleton } from "@/features/vehicle/components/vehicle-list-skeleton";

/**
 * 車両一覧画面の遷移時用ローディング
 *
 * @returns 車両一覧スケルトンコンポーネント
 */
export default function VehiclesLoading() {
  return <VehicleListSkeleton />;
}
