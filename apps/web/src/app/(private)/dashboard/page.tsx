"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { OwnerDashboard } from "@/features/dashboard/components/owner-dashboard";
import { ShopDashboard } from "@/features/dashboard/components/shop-dashboard";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type {
  OwnerDashboardResponse,
  ShopDashboardResponse,
} from "@/features/dashboard/types/dashboard";
import { USER_ROLE } from "@/shared/constants/role";
import { useHeader } from "@/shared/hooks/use-header";
import { useAuthStore } from "@/stores/auth-store";

/**
 * ダッシュボード表示用インナーコンポーネント
 *
 * APIからデータを取り直し、ユーザーのロールに応じて
 * オーナー用/ショップ用のダッシュボードを切り替えて表示します。
 *
 * @component
 * @returns ダッシュボードコンテンツのJSX要素
 */
function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const { data, isPending, isError, error } = useDashboard();

  // 動的ヘッダーにタイトルを登録
  useHeader({ title: "ホーム" });

  // TODO: 今後 Skeleton UI を実装予定（現在は仮ローディング表示）
  if (isPending) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-muted-foreground">データを読み込んでいます...</p>
      </div>
    );
  }

  // TODO: 今後 Error State / Retry UI を実装予定（現在は仮エラー表示）
  if (isError || !data) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-destructive">
          {error?.message || "データの取得に失敗しました。"}
        </p>
      </div>
    );
  }

  // ログインユーザーのロールに応じた判定 & 型キャストしてコンポーネントへ渡す
  if (user?.role === USER_ROLE.SHOP && "maintenanceCountChart" in data) {
    return <ShopDashboard data={data as ShopDashboardResponse} />;
  }

  return <OwnerDashboard data={data as OwnerDashboardResponse} />;
}

/**
 * ダッシュボード画面ページエントリーポイント
 *
 * OWNER (個人ユーザー) または SHOP (整備工場ユーザー) のみアクセスを許可します。
 *
 * @component
 * @returns ガードされたダッシュボードページのJSX要素
 */
export default function DashboardPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <DashboardContent />
    </RoleGuard>
  );
}
// "use client";

// import { RoleGuard } from "@/features/auth/components/role-guard";
// import { Dashboard } from "@/features/dashboard/components/dashboard";
// import { USER_ROLE } from "@/shared/constants/role";

// /**
//  * ダッシュボード画面ページエントリーポイント
//  *
//  * OWNER (個人ユーザー) または SHOP (整備工場ユーザー) のみアクセスを許可します。
//  */
// export default function DashboardPage() {
//   return (
//     <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
//       <Dashboard />
//     </RoleGuard>
//   );
// }
