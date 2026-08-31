"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useVehicleList } from "@/features/vehicle/hooks/use-vehicle-list";

/** 「すべて」を表すsentinel値（Radix Selectは空文字列のvalueを許容しないため） */
const ALL_VEHICLES_VALUE = "ALL";

/**
 * Props型定義
 */
interface VehicleFilterSelectProps {
  /**
   * 選択肢となる車両一覧の取得元オーナーID
   *
   * 整備履歴一覧APIレスポンスの`owner.id`（自分自身の場合はundefined）を渡す。
   * URLの`ownerId`クエリパラメータをそのまま使わないのは、`vehicleId`指定時は
   * URLに`ownerId`が付与されないケースがあり、その場合でも常に対象車両の
   * 正しい所有者の車両一覧を取得するため。
   */
  ownerId?: string;
  /** 選択中の車両ID（未指定＝「すべて」） */
  value?: string;
  /** 選択変更時のコールバック（未指定＝「すべて」） */
  onChange: (vehicleId?: string) => void;
}

/**
 * 整備履歴一覧画面の車両絞り込みプルダウン
 *
 * @component
 */
export function VehicleFilterSelect({
  ownerId,
  value,
  onChange,
}: VehicleFilterSelectProps) {
  // 絞り込み選択肢となる車両一覧の取得
  const { data, isPending } = useVehicleList(ownerId);
  // Selectの選択肢形式（value/label）に変換した車両一覧
  const vehicleOptions =
    data?.vehicles.map((vehicle) => ({
      value: vehicle.id,
      label: vehicle.modelCode
        ? `${vehicle.modelName} ${vehicle.modelCode}`
        : vehicle.modelName,
    })) ?? [];

  return (
    <Select
      value={value ?? ALL_VEHICLES_VALUE}
      onValueChange={(next) =>
        onChange(next === ALL_VEHICLES_VALUE ? undefined : next)
      }
      disabled={isPending}
    >
      <SelectTrigger className="w-auto min-w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VEHICLES_VALUE}>すべて</SelectItem>
        {vehicleOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
