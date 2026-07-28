"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { OwnerDashboard } from "@/features/dashboard/components/owner-dashboard";
import { ShopDashboard } from "@/features/dashboard/components/shop-dashboard";
import { USER_ROLE } from "@/shared/constants/role";
import {
  ownerDashboardMock,
  shopDashboardMock,
} from "@/features/dashboard/mock/mock-data";
import { useAuthStore } from "@/stores/auth-store";
import { useHeader } from "@/shared/hooks/use-header";

/**
 * ダッシュボード表示用インナーコンポーネント
 */
function DashboardContent() {
  const user = useAuthStore((state) => state.user);

  // 動的ヘッダーにタイトルを登録
  useHeader({ title: "ホーム" });

  return (
    <main>
      {user?.role === USER_ROLE.SHOP ? (
        <ShopDashboard data={shopDashboardMock} />
      ) : (
        <OwnerDashboard data={ownerDashboardMock} />
      )}
    </main>
  );
}

/**
 * ダッシュボード画面ページエントリーポイント
 */
export default function DashboardPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <DashboardContent />
    </RoleGuard>
  );
}
// TODO:現状はV0のモックを移植し画面が描画されるかの確認のため、確認が取れ次第ロジック肉付けとリファクタ
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
