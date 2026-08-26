"use client";

import { useState } from "react";
import { maintenanceRecordApi } from "../api/maintenance-record-api";
import { maintenanceRecordKeys } from "../constants/maintenance-record-keys";
import type { UpdateMaintenanceRecordRequest } from "../types/maintenance-record";
import { queryClient } from "@/providers/query-provider";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";
import { getErrorMessage } from "@/lib/api/get-error-message";

/**
 * 整備履歴の更新処理を行うカスタムフック
 *
 * @param maintenanceRecordId 整備履歴ID
 * @returns 整備履歴更新処理関数、ローディング状態、エラー状態
 */
export function useUpdateMaintenanceRecord(maintenanceRecordId: string) {
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態を管理するstate
  const [error, setError] = useState<string | null>(null);

  /**
   * 整備履歴更新処理
   *
   * @param data           整備履歴更新リクエスト
   * @param workItemImages 作業項目のインデックスをキーとした差し替え画像ファイルのMap
   *                       （画像を変更しない作業項目は含めない）
   * @returns 更新成否のフラグ
   */
  const updateMaintenanceRecord = async (
    data: UpdateMaintenanceRecordRequest,
    workItemImages: Map<number, File>,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // 整備履歴更新APIリクエスト実行
      await maintenanceRecordApi.update(maintenanceRecordId, data, workItemImages);

      // キャッシュ済みの整備履歴詳細を無効化し、次回参照時に最新値を再取得させる
      await queryClient.invalidateQueries({
        queryKey: maintenanceRecordKeys.detail(maintenanceRecordId),
      });
      // 一覧は絞り込み条件ごとに別キーで多数キャッシュされ得るため、
      // "list"配下をまとめて無効化するプレフィックス指定にする（登録時と同じ方針）
      await queryClient.invalidateQueries({
        queryKey: [...maintenanceRecordKeys.all, "list"],
      });

      appToast.success(TOAST_MESSAGES.SUCCESS.MAINTENANCE_RECORD.UPDATE);

      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateMaintenanceRecord, isLoading, error };
}
