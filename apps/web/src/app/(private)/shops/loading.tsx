import { ShopListSkeleton } from "@/features/shop/components/shop-list-skeleton";

/**
 * ショップ一覧画面の遷移時用ローディング
 *
 * @returns ショップ一覧スケルトンコンポーネント
 */
export default function ShopsLoading() {
  return <ShopListSkeleton />;
}
