import { CustomerListSkeleton } from "@/features/customer/components/customer-list-skeleton";

/**
 * 顧客一覧画面の遷移時用ローディング
 *
 * @returns 顧客一覧スケルトンコンポーネント
 */
export default function CustomersLoading() {
  return <CustomerListSkeleton />;
}
