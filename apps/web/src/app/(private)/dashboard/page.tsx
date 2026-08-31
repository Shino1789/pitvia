"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * ダッシュボード画面ページエントリーポイント
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
