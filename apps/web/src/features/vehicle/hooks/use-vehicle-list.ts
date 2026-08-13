"use client";

import { useQuery } from "@tanstack/react-query";
import { vehicleQueries } from "../queries/vehicle-queries";

/**
 * 車両一覧を取得・管理するカスタムフック
 *
 * @param ownerId 対象オーナーID（省略時はログインユーザー自身の一覧）
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useVehicleList(ownerId?: string) {
  return useQuery(vehicleQueries.list(ownerId));
}
