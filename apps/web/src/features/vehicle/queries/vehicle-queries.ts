import { queryOptions } from "@tanstack/react-query";
import { vehicleApi } from "../api/vehicle-api";
import { vehicleKeys } from "../constants/vehicle-keys";

/**
 * 車両機能用 Query Options 定義
 */
export const vehicleQueries = {
  /**
   * 車両登録フォームの選択肢 Query Options
   *
   * @param vehicleType 対象の車両種別
   */
  formOptions: (vehicleType: string) =>
    queryOptions({
      queryKey: vehicleKeys.formOptions(vehicleType),
      queryFn: () => vehicleApi.getFormOptions(vehicleType),
    }),

  /**
   * 車両詳細 Query Options
   *
   * @param vehicleId 車両ID
   */
  detail: (vehicleId: string) =>
    queryOptions({
      queryKey: vehicleKeys.detail(vehicleId),
      queryFn: () => vehicleApi.getDetail(vehicleId),
      // 車両IDが確定している場合のみクエリを実行
      enabled: !!vehicleId,
    }),
};
