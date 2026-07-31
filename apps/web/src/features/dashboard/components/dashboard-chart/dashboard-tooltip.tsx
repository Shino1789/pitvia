import type { ChartPoint } from "@/features/dashboard/types/dashboard";
import type { PeriodType } from "@/shared/constants/period";
import {
  MAINTENANCE_TYPE_CHART_COLOR,
  MAINTENANCE_TYPE_LABELS,
} from "@/shared/constants/maintenance-type";
import { formatPeriodTooltip } from "@/shared/utils/format";

/**
 * Props型定義
 */
export interface DashboardTooltipProps {
  /** ツールチップがアクティブ（表示中）かどうか（Rechartsより自動注入） */
  active?: boolean;
  /** ホバー要素のデータペイロード（Rechartsより自動注入） */
  payload?: { payload: ChartPoint }[];
  /** 表示期間の種別（日次・月次・年次など） */
  periodType: PeriodType;
  /** ツールチップ内の数値フォーマット関数 */
  formatTooltipValue: (value: number) => string;
  /** 合計値のラベル名（例: "合計費用", "整備件数"） */
  totalLabel: string;
}

/**
 * ダッシュボードグラフ用カスタムツールチップコンポーネント（Recharts用）
 * （ホバー位置の期間・合計値・整備種別ごとの内訳を表示）
 *
 * @component
 */
export function DashboardTooltip({
  active,
  payload,
  periodType,
  formatTooltipValue,
  totalLabel,
}: DashboardTooltipProps) {
  // ツールチップ非表示条件
  if (!active || !payload || !payload.length) return null;

  // ホバー中データの参照
  const point = payload[0].payload;

  // 内訳データ（値が0より大きいものを抽出し、数値の大きい順にソート）
  const breakdown = [...point.breakdown]
    .filter((b) => b.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
      {/* 期間表示エリア（例: "2026年7月"） */}
      <p className="font-semibold text-foreground mb-2">
        {formatPeriodTooltip(point.period, periodType)}
      </p>

      {/* 合計値表示エリア */}
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-primary font-medium">{totalLabel}</span>
        <span className="font-semibold text-foreground">
          {formatTooltipValue(point.totalValue)}
        </span>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-border my-2" />

      {/* 整備種別ごとの内訳リスト表示 */}
      <div className="space-y-1 text-sm">
        {breakdown.map((item) => (
          <div key={item.category} className="flex justify-between gap-4">
            {/* 左側：カテゴリドットカラー ＆ 整備種別ラベル */}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: MAINTENANCE_TYPE_CHART_COLOR[item.category],
                }}
                aria-hidden="true"
              />
              {MAINTENANCE_TYPE_LABELS[item.category]}
            </span>

            {/* 右側：内訳の数値 */}
            <span className="text-foreground">
              {formatTooltipValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
