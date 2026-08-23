"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { vehicleApi } from "../api/vehicle-api";
import { vehicleKeys } from "../constants/vehicle-keys";
import type { CreateVehicleRequest } from "../types/vehicle";
import { ROUTES } from "@/shared/constants/routes";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 車両の新規登録処理を行うカスタムフック
 *
 * @returns 車両登録処理関数、ローディング状態、エラー状態
 */
export function useRegisterVehicle() {
  // Next.jsのルーターを取得
  const router = useRouter();
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * 車両登録処理
   *
   * @param data  車両登録リクエスト
   * @param image 車両画像ファイル（任意）
   * @returns 登録成否のフラグ
   */
  const registerVehicle = async (
    data: CreateVehicleRequest,
    image: File | null,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // 車両登録APIリクエスト実行
      await vehicleApi.register(data, image);

      // キャッシュ済みの車両一覧を無効化し、次回参照時に最新値を再取得させる
      await queryClient.invalidateQueries({
        queryKey: vehicleKeys.list(),
      });

      appToast.success(TOAST_MESSAGES.SUCCESS.VEHICLE.REGISTER);

      // 二重送信防止のため、ブラウザの「戻る」で登録画面に戻らないreplaceで遷移
      router.replace(ROUTES.VEHICLES);

      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      setIsLoading(false);
      return false;
    }
  };

  return { registerVehicle, isLoading, error };
}
