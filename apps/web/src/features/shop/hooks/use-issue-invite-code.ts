"use client";

import { useMutation } from "@tanstack/react-query";
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
 * POSTのレスポンスに新しい招待コードがそのまま含まれるため、成功時はGETの再実行
 * （invalidateQueries）ではなく、レスポンスを直接キャッシュへ反映する（setQueryData）。
 *
 * @returns 招待コード発行処理関数、ローディング状態、エラー状態
 */
export function useIssueInviteCode() {
  const mutation = useMutation({
    mutationFn: () => shopApi.issueInviteCode(),

    onSuccess: (result) => {
      // 発行結果をそのままキャッシュへ反映（GETの再取得を待たずに画面へ即時反映するため）
      queryClient.setQueryData(shopKeys.inviteCode(), result);

      appToast.success(TOAST_MESSAGES.SUCCESS.SHOP.INVITE_CODE_ISSUE);
    },

    onError: (error) => {
      appToast.error(getErrorMessage(error));
    },
  });

  /**
   * 招待コード発行処理
   *
   * 呼び出し側でPromiseをawait/catchしなくても未処理のrejectionにならないよう、
   * 失敗時は例外を投げずnullを返す（成功/失敗の通知自体はonSuccess/onErrorのトーストが担う）。
   *
   * @returns 発行に成功した場合は新しい招待コード、失敗した場合はnull
   */
  const issueInviteCode = async (): Promise<ShopInviteCode | null> => {
    try {
      return await mutation.mutateAsync();
    } catch {
      return null;
    }
  };

  return {
    issueInviteCode,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
