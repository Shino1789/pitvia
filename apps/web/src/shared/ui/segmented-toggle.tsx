import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

/**
 * 選択肢1件分の定義
 */
export interface SegmentedToggleOption<T extends string> {
  /** 選択値 */
  value: T;
  /** 表示ラベル */
  label: string;
  /** ラベル前に表示するアイコン（任意） */
  icon?: LucideIcon;
}

/**
 * Props型定義
 */
interface SegmentedToggleProps<T extends string> {
  /** 選択肢一覧 */
  options: SegmentedToggleOption<T>[];
  /** 現在選択されている値 */
  value: T;
  /** 選択変更時のコールバック */
  onChange: (value: T) => void;
  /** スクリーンリーダー向けのグループラベル */
  ariaLabel: string;
  /** 外枠のカスタムクラス */
  className?: string;
}

/**
 * 少数の選択肢から1つを選ぶ、セグメント形式のトグルボタン群
 *
 * `dashboard-chart-header.tsx` の月次/年次切り替えボタンと同じ見た目・実装方式
 * （Radixのプリミティブは使わず、Buttonとaria-pressedのみで構成）を汎用化したもの。
 *
 * @component
 */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={cn(
        // w-fit/self-startで、グリッド配置時にコンテナ幅・高さいっぱいへストレッチされるのを防ぎ、
        // ボタン群の実サイズぴったりの枠になるようにする
        "flex w-fit self-start rounded-lg border border-border overflow-hidden",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              "rounded-none px-4 h-8 gap-1.5",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
