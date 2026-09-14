"use client";

import { useState } from "react";
import { shopApi } from "../api/shop-api";
import { shopKeys } from "../constants/shop-keys";
import type { ShopInviteCode } from "../types/shop";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 招待コードの新規発行（再発行）処理を行うカスタムフック
 *
 * @returns 招待コード発行処理関数、ローディング状態、エラー状態
 */
export function useIssueInviteCode() {
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * 招待コード発行処理
   *
   * @returns 発行に成功した場合は新しい招待コード、失敗した場合はnull
   */
  const issueInviteCode = async (): Promise<ShopInviteCode | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 招待コード発行APIリクエスト実行
      const result = await shopApi.issueInviteCode();

      // 発行結果をそのままキャッシュへ反映（GETの再取得を待たずに画面へ即時反映するため）
      queryClient.setQueryData(shopKeys.inviteCode(), result);

      appToast.success(TOAST_MESSAGES.SUCCESS.SHOP.INVITE_CODE_ISSUE);

      return result;
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message);
      appToast.error(message);

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { issueInviteCode, isLoading, error };
}
