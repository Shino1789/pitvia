"use client";

import { useState } from "react";
import { vehicleApi } from "../api/vehicle-api";
import { vehicleKeys } from "../constants/vehicle-keys";
import type { UpdateVehicleRequest } from "../types/vehicle";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 車両情報の更新処理を行うカスタムフック
 *
 * @param vehicleId 車両ID
 * @returns 車両更新処理関数、ローディング状態、エラー状態
 */
export function useUpdateVehicle(vehicleId: string) {
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * 車両更新処理
   *
   * @param data  車両更新リクエスト
   * @param image 車両画像ファイル（未変更の場合はnull）
   * @returns 更新成否のフラグ
   */
  const updateVehicle = async (
    data: UpdateVehicleRequest,
    image: File | null,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // 車両更新APIリクエスト実行
      await vehicleApi.update(vehicleId, data, image);

      // キャッシュ済みの車両詳細・一覧を無効化し、次回参照時に最新値を再取得させる
      await queryClient.invalidateQueries({
        queryKey: vehicleKeys.detail(vehicleId),
      });
      await queryClient.invalidateQueries({
        queryKey: vehicleKeys.list(),
      });

      // 更新成功トースト表示
      appToast.success(TOAST_MESSAGES.SUCCESS.VEHICLE.UPDATE);

      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateVehicle, isLoading, error };
}
