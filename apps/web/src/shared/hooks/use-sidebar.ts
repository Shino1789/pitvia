"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MENU_ITEMS } from "@/shared/constants/menu";
import { ROUTES } from "@/shared/constants/routes";
import { authSession } from "@/features/auth/services/auth-session";
import { useAuthStore } from "@/stores/auth-store";

/**
 * サイドバーの表示制御および操作用ロジック（メニュー取得・アクティブ判定・ログアウト処理等）を一括管理するカスタムフック
 *
 * @param onClose モバイル表示時などにサイドバーを閉じるためのコールバック関数（任意）
 * @returns ユーザー情報、メニュー一覧、パスアクティブ判定関数、ログアウト処理関数等
 */
export function useSidebar(onClose?: () => void) {
  // 現在のページパスを取得
  const pathname = usePathname();
  // Next.js のルーターを取得
  const router = useRouter();
  // ストアからログインユーザー情報を取得
  const user = useAuthStore((state) => state.user);

  /**
   * ログアウト処理を実行し、ログイン画面へ遷移するハンドラー関数
   */
  const handleLogout = async () => {
    // ドロワーが開いている場合は閉じる
    if (onClose) onClose();
    // ログアウト処理を実行
    await authSession.logout();
    // ログイン画面へリダイレクト
    router.push(ROUTES.LOGIN);
  };

  /**
   * ログインユーザーのロールに合致し、かつサイドバーに表示させるメニュー項目を抽出
   */
  const filteredMenuItems = useMemo(
    () =>
      MENU_ITEMS.filter(
        (item) =>
          user && item.roles.includes(user.role) && (item.sidebar ?? true),
      ),
    [user],
  );

  /**
   * 指定されたメニューのパスが、現在表示中のパスと一致（または配下ページ）しているかを判定
   *
   * @param itemPath 判定対象のメニューパス
   * @returns アクティブ状態の場合 true
   */
  const isPathActive = (itemPath: string) => {
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  // アバター画像がない場合のフォールバック用（ユーザー名の頭文字1文字、非ログイン時は "U"）
  const userInitial = user?.userName ? user.userName.charAt(0) : "U";

  return {
    user,
    userInitial,
    menuItems: filteredMenuItems,
    isPathActive,
    handleLogout,
  };
}
