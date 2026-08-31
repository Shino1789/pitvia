"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { maintenanceRecordApi } from "../api/maintenance-record-api";
import { maintenanceRecordKeys } from "../constants/maintenance-record-keys";
import { ROUTES } from "@/shared/constants/routes";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 整備履歴の削除処理を行うカスタムフック
 *
 * @param maintenanceRecordId 整備履歴ID
 * @returns 整備履歴削除処理関数、ローディング状態、エラー状態
 */
export function useDeleteMaintenanceRecord(maintenanceRecordId: string) {
  // Next.jsのルーターを取得
  const router = useRouter();
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * 整備履歴削除処理
   *
   * @param redirectTo 削除成功後の遷移先（未指定時は整備履歴一覧。車両ごとに絞り込んだ
   *                   一覧から遷移してきた場合は、同じ絞り込み状態の一覧へ戻すために使う）
   * @returns 削除成否のフラグ
   */
  const deleteMaintenanceRecord = async (
    redirectTo: string = ROUTES.MAINTENANCES,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // 整備履歴削除APIリクエスト実行
      await maintenanceRecordApi.remove(maintenanceRecordId);

      // キャッシュ済みの整備履歴一覧を無効化し、次回参照時に最新値を再取得させる
      await queryClient.invalidateQueries({
        queryKey: [...maintenanceRecordKeys.all, "list"],
      });
      // 削除済みの詳細キャッシュも破棄する
      queryClient.removeQueries({
        queryKey: maintenanceRecordKeys.detail(maintenanceRecordId),
      });

      appToast.success(TOAST_MESSAGES.SUCCESS.MAINTENANCE_RECORD.DELETE);

      // 削除済みの詳細画面へ「戻る」で再度到達できないよう、replaceで一覧へ遷移
      router.replace(redirectTo);

      return true;
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message);
      setIsLoading(false);

      // 削除操作はフォームを持たない一発アクションのため、成功時と対称にトーストで通知する
      // （useDeleteVehicleと同じ方針）
      appToast.error(message);

      return false;
    }
  };

  return { deleteMaintenanceRecord, isLoading, error };
}
