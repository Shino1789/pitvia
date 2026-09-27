"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { CustomerListContent } from "@/features/customer/components/customer-list-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * 顧客一覧画面ページエントリーポイント
 *
 * SHOPロール専用（OWNERがアクセスした場合はRoleGuardにより403画面へリダイレクトされる）。
 *
 * @component
 * @returns ガードされた顧客一覧ページのJSX要素
 */
export default function CustomersPage() {
  return (
    <RoleGuard allow={[USER_ROLE.SHOP]}>
      <CustomerListContent />
    </RoleGuard>
  );
}
