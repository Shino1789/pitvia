"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { VehicleDetailContent } from "@/features/vehicle/components/vehicle-detail-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * 車両詳細・変更画面ページエントリーポイント
 *
 * @component
 * @returns ガードされた車両詳細ページのJSX要素
 */
export default function VehicleDetailPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <VehicleDetailContent />
    </RoleGuard>
  );
}
