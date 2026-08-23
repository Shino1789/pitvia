"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { maintenanceRecordApi } from "../api/maintenance-record-api";
import { maintenanceRecordKeys } from "../constants/maintenance-record-keys";
import type { CreateMaintenanceRecordRequest } from "../types/maintenance-record";
import { ROUTES } from "@/shared/constants/routes";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 整備履歴の新規登録処理を行うカスタムフック
 *
 * @returns 整備履歴登録処理関数、ローディング状態、エラー状態
 */
export function useRegisterMaintenanceRecord() {
  // Next.jsのルーターを取得
  const router = useRouter();
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * 整備履歴登録処理
   *
   * @param data           整備履歴登録リクエスト
   * @param workItemImages 作業項目のインデックスをキーとした画像ファイルのMap
   * @param redirectTo     登録成功後の遷移先（未指定時は整備履歴一覧。車両ごとに絞り込んだ
   *                       一覧から登録した場合は、同じ絞り込み状態の一覧へ戻すために使う）
   * @returns 登録成否のフラグ
   */
  const registerMaintenanceRecord = async (
    data: CreateMaintenanceRecordRequest,
    workItemImages: Map<number, File>,
    redirectTo: string = ROUTES.MAINTENANCES,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // 整備履歴登録APIリクエスト実行
      await maintenanceRecordApi.register(data, workItemImages);

      // キャッシュ済みの整備履歴一覧を無効化し、次回参照時に最新値を再取得させる。
      // 一覧は絞り込み条件（vehicleId/ownerId等）ごとに別キーで多数キャッシュされ得るため、
      // vehicleKeys.list()のような厳密一致ではなく"list"配下をまとめて無効化するプレフィックス指定にする
      await queryClient.invalidateQueries({
        queryKey: [...maintenanceRecordKeys.all, "list"],
      });

      appToast.success(TOAST_MESSAGES.SUCCESS.MAINTENANCE_RECORD.REGISTER);

      // 二重送信防止のため、ブラウザの「戻る」で登録画面に戻らないreplaceで遷移
      router.replace(redirectTo);

      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      setIsLoading(false);
      return false;
    }
  };

  return { registerMaintenanceRecord, isLoading, error };
}
