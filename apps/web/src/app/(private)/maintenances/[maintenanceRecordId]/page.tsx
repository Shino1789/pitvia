"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { MaintenanceRecordDetailContent } from "@/features/maintenance-record/components/maintenance-record-detail-content";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * 整備履歴詳細・更新画面ページエントリーポイント
 *
 * <p>
 * 詳細取得APIは今回のスコープ外のため未実装。{@link MaintenanceRecordDetailContent}は
 * モックデータでUIを表示する（登録画面とのフォームUI共通化の確認用）。
 * </p>
 *
 * @component
 * @returns ガードされた整備履歴詳細ページのJSX要素
 */
export default function MaintenanceRecordDetailPage() {
  return (
    <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
      <MaintenanceRecordDetailContent />
    </RoleGuard>
  );
}
