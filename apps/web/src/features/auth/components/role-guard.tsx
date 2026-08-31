"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/shared/constants/role";
import { ROUTES } from "@/shared/constants/routes";

/**
 * Props型定義
 */
type Props = {
  /** アクセスを許可するユーザーロール */
  allow: ReadonlyArray<UserRole>;

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
  // Next.jsのルーターを取得
  const router = useRouter();
  // グローバルストアから現在のログインユーザー情報を取得
  const user = useAuthStore((state) => state.user);

  const isAllowed = user ? allow.includes(user.role) : false;

  useEffect(() => {
    // 画面描画後に権限がない場合は403画面に飛ばす
    if (user && !isAllowed) {
      router.replace(ROUTES.FORBIDDEN);
    }
  }, [user, isAllowed, router]);

  // 権限がないユーザーは画面を描画しない(チラつき防止)
  if (!isAllowed) {
    return null;
  }

  // 権限のあるユーザーは対象の画面を描画
  return <>{children}</>;
}
