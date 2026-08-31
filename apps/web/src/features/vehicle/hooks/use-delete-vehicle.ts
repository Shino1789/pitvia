"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { vehicleApi } from "../api/vehicle-api";
import { vehicleKeys } from "../constants/vehicle-keys";
import { ROUTES } from "@/shared/constants/routes";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 車両の削除処理を行うカスタムフック
 *
 * @param vehicleId 車両ID
 * @returns 車両削除処理関数、ローディング状態、エラー状態
 */
export function useDeleteVehicle(vehicleId: string) {
  // Next.jsのルーターを取得
  const router = useRouter();
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * 車両削除処理
   *
   * @returns 削除成否のフラグ
   */
  const deleteVehicle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // 車両削除APIリクエスト実行
      await vehicleApi.remove(vehicleId);

      // キャッシュ済みの車両一覧を無効化し、次回参照時に最新値を再取得させる
      await queryClient.invalidateQueries({
        queryKey: vehicleKeys.list(),
      });

      appToast.success(TOAST_MESSAGES.SUCCESS.VEHICLE.DELETE);

      // 削除済みの詳細画面へ「戻る」で再度到達できないよう、replaceで一覧へ遷移
      router.replace(ROUTES.VEHICLES);

      return true;
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message);
      setIsLoading(false);

      // 削除操作はフォームを持たない一発アクションのため、成功時と対称にトーストで通知する
      appToast.error(message);

      return false;
    }
  };

  return { deleteVehicle, isLoading, error };
}
