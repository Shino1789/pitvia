"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/shared/constants/role";

/**
 * Props型定義
 */
type Props = {
  /** アクセスを許可するユーザーロールの配列 */
  allow: UserRole[];
  /** 認可された場合に表示する子コンポーネント */
  children: ReactNode;
};

/**
 * ログインユーザーの権限に基づいて表示を制御する認可ガードコンポーネント
 *
 * @component
 * @returns 認可成功時は子コンポーネント、認可失敗時はForbidden画面
 */
export function RoleGuard({ allow, children }: Props) {
  // グローバルストアから現在のログインユーザー情報を取得
  const user = useAuthStore((state) => state.user);

  // ユーザー情報自体が存在しない場合は、前提条件エラーとして例外をスロー
  if (!user) {
    throw new Error("User is not initialized.");
  }

  // 現在のユーザーロールが、許可されたロール配列に含まれているかチェック
  if (!allow.includes(user.role)) {
    // TODO: forbidden画面はカスタマイズ要検討
    return <div>このページにアクセスする権限がありません。</div>;
  }

  // 認可チェックを通過した場合は、対象の画面を描画
  return <>{children}</>;
}
