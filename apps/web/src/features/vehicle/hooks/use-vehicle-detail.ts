"use client";

import { useQuery } from "@tanstack/react-query";
import { vehicleQueries } from "../queries/vehicle-queries";

/**
 * 車両詳細情報を取得・管理するカスタムフック
 *
 * @param vehicleId 車両ID
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useVehicleDetail(vehicleId: string) {
  return useQuery(vehicleQueries.detail(vehicleId));
}
