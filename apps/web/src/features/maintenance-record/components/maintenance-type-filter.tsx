"use client";

import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import {
  MAINTENANCE_TYPE,
  MAINTENANCE_TYPE_LABELS,
  type MaintenanceType,
} from "@/shared/constants/maintenance-type";

/** 整備種別一覧（定義順＝表示順） */
const ALL_TYPES = Object.values(MAINTENANCE_TYPE);

/**
 * Props型定義
 */
interface MaintenanceTypeFilterProps {
  /** 選択中の整備種別（空配列＝「すべて」選択中） */
  selected: MaintenanceType[];
  /** 選択変更時のコールバック */
  onChange: (types: MaintenanceType[]) => void;
  /** 外枠のカスタムクラス */
  className?: string;
}

/**
 * 整備種別の複数選択フィルター
 *
 * 「すべて」選択時は他の選択状態を解除し、他の整備種別を1つでも選択すると「すべて」を解除する。
 * `SegmentedToggle`は単一選択専用のため、複数選択が必要な本コンポーネントは別実装とする。
 *
 * @component
 */
export function MaintenanceTypeFilter({
  selected,
  onChange,
  className,
}: MaintenanceTypeFilterProps) {
  const isAllSelected = selected.length === 0;

  /**
   * 「すべて」選択時のハンドラー
   */
  const handleSelectAll = () => {
    onChange([]);
  };

  /**
   * 個別の整備種別選択時のハンドラー
   *
   * @param type 選択・解除対象の整備種別
   */
  const handleToggle = (type: MaintenanceType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((selectedType) => selectedType !== type));
      return;
    }
    onChange([...selected, type]);
  };

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="整備種別で絞り込み"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSelectAll}
        aria-pressed={isAllSelected}
        className={cn(
          "h-8 rounded-full px-3.5",
          isAllSelected
            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground",
        )}
      >
        すべて
      </Button>

      {ALL_TYPES.map((type) => {
        const isActive = selected.includes(type);

        return (
          <Button
            key={type}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(type)}
            aria-pressed={isActive}
            className={cn(
              "h-8 rounded-full px-3.5",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {MAINTENANCE_TYPE_LABELS[type]}
          </Button>
        );
      })}
    </div>
  );
}
