"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { VehicleListContent } from "@/features/vehicle/components/vehicle-list-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * 車両一覧画面ページエントリーポイント
 *
 * @component
 * @returns ガードされた車両一覧ページのJSX要素
 */
export default function VehiclesPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <VehicleListContent />
    </RoleGuard>
  );
}
