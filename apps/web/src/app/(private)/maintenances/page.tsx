"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { MaintenanceRecordListContent } from "@/features/maintenance-record/components/maintenance-record-list-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * 整備履歴一覧画面ページエントリーポイント
 *
 * @component
 * @returns ガードされた整備履歴一覧ページのJSX要素
 */
export default function MaintenancesPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <MaintenanceRecordListContent />
    </RoleGuard>
  );
}
