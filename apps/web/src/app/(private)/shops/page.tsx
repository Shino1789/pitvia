"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { ShopListContent } from "@/features/shop/components/shop-list-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * ショップ一覧画面ページエントリーポイント
 *
 * OWNERロール専用（SHOPがアクセスした場合はRoleGuardにより403画面へリダイレクトされる）。
 *
 * @component
 * @returns ガードされたショップ一覧ページのJSX要素
 */
export default function ShopsPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER]}>
      <ShopListContent />
    </RoleGuard>
  );
}
