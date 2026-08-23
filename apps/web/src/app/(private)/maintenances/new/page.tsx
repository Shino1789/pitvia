"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { MaintenanceRecordRegisterContent } from "@/features/maintenance-record/components/maintenance-record-register-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * 整備履歴登録画面ページエントリーポイント
 *
 * @component
 * @returns ガードされた整備履歴登録ページのJSX要素
 */
export default function MaintenanceRecordNewPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <MaintenanceRecordRegisterContent />
    </RoleGuard>
  );
}
