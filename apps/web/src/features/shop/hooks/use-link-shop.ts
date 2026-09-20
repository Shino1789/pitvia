"use client";

import { useMutation } from "@tanstack/react-query";
import { shopApi } from "../api/shop-api";
import { shopKeys } from "../constants/shop-keys";
import type { ShopLinkRequest } from "../types/shop";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 招待コード入力によるショップ連携処理を行うカスタムフック（OWNER専用）
 *
 * 成功時は連携済みショップ一覧のキャッシュを（絞り込み・ページング条件を問わず）無効化して
 * 再取得したうえで成功トーストを表示する。失敗時は例外を投げず、エラーメッセージを
 * `error`として保持する（フォーム上部へのインライン表示は呼び出し側の責務）。
 *
 * @returns ショップ連携処理関数、ローディング状態、エラーメッセージ、エラー状態のリセット関数
 */
export function useLinkShop() {
  const mutation = useMutation({
    mutationFn: (data: ShopLinkRequest) => shopApi.link(data),

    onSuccess: async () => {
      // 一覧の再取得が完了してから成功扱いにすることで、モーダルが閉じた時点で
      // 新しく連携されたショップが一覧へ反映されている状態にする
      await queryClient.invalidateQueries({ queryKey: shopKeys.lists() });

      appToast.success(TOAST_MESSAGES.SUCCESS.SHOP.LINK);
    },
  });

  /**
   * ショップ連携処理
   *
   * 呼び出し側でPromiseをawait/catchしなくても未処理のrejectionにならないよう、
   * 失敗時は例外を投げず成否のフラグで返す。
   *
   * @param data 連携対象の車両IDと招待コード
   * @returns 連携に成功した場合はtrue、失敗した場合はfalse
   */
  const linkShop = async (data: ShopLinkRequest): Promise<boolean> => {
    try {
      await mutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  return {
    linkShop,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}
