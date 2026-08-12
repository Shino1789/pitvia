"use client";

import { useQuery } from "@tanstack/react-query";
import { vehicleQueries } from "../queries/vehicle-queries";

/**
 * 車両登録フォームの選択肢を取得・管理するカスタムフック
 *
 * @param vehicleType 対象の車両種別（現状は"CAR"固定）
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useVehicleFormOptions(vehicleType: string) {
  return useQuery(vehicleQueries.formOptions(vehicleType));
}
