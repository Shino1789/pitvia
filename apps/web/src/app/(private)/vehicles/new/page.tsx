"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { VehicleRegisterContent } from "@/features/vehicle/components/vehicle-register-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * 車両登録画面ページエントリーポイント
 *
 * @component
 * @returns 車両登録ページのJSX要素
 */
export default function VehicleNewPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <VehicleRegisterContent />
    </RoleGuard>
  );
}
