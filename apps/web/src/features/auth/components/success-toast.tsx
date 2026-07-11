"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";

/**
 * アカウント登録成功時のトースト通知およびURLクリーンアップを制御するコンポーネント
 *
 * @component
 */
export function LoginSuccessToast() {
  // Next.jsのルーターを取得
  const router = useRouter();
  // 現在のパス名（クエリパラメータを除く）を取得
  const pathname = usePathname();
  // URLのクエリパラメータを取得
  const searchParams = useSearchParams();

  useEffect(() => {
    // registered=true パラメータがない場合は何も処理しない
    if (searchParams.get("registered") !== "true") return;

    // 共通ラッパーを経由して登録成功トーストを表示（3秒自動消滅）
    appToast.success(TOAST_MESSAGES.SUCCESS.AUTH.REGISTER);

    // F5リロード時などの再表示を防ぐため、クエリパラメータをURLから除去してリプレイス
    router.replace(pathname);
  }, [pathname, router, searchParams]);

  // UIは持たないため null を返却
  return null;
}
