import type { ChartPoint } from "@/features/dashboard/types/dashboard";
import type { PeriodType } from "@/shared/constants/period";
import { ChartContainer } from "@/shared/ui/chart";
import { formatPeriodAxis } from "@/shared/utils/format";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardTooltip } from "./dashboard-tooltip";

/**
 * Props型定義
 */
interface DashboardBarChartProps {
  /** グラフ描画用データ配列 */
  displayItems: ChartPoint[];
  /** 表示期間の種別（日次・月次・年次など） */
  periodType: PeriodType;
  /** 合計値のラベル名（例: "合計費用", "整備件数"） */
  totalLabel: string;
  /** Y軸目盛りのフォーマット関数 */
  formatAxisValue: (value: number) => string;
  /** ツールチップ内の数値フォーマット関数 */
  formatTooltipValue: (value: number) => string;
}

/**
 * ダッシュボード用の棒グラフコンポーネント
 *
 * @component
 */
export function DashboardBarChart({
  displayItems,
  periodType,
  totalLabel,
  formatAxisValue,
  formatTooltipValue,
}: DashboardBarChartProps) {
  // ChartContainer に渡すカラー・ラベル等の設定
  const chartConfig = {
    totalValue: { label: totalLabel, color: "var(--primary)" },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={displayItems}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* 棒グラフのグラデーションカラー定義 */}
          <defs>
            <linearGradient
              id="dashboardBarGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity={0.6}
              />
            </linearGradient>
          </defs>

          {/* X軸（期間表示） */}
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value: string) =>
              formatPeriodAxis(value, periodType)
            }
            dy={10}
          />

          {/* YAxis（数値目盛り） */}
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={formatAxisValue}
            dx={-5}
            width={55}
          />

          {/* ホバー時のツールチップ表示 */}
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            content={
              <DashboardTooltip
                periodType={periodType}
                formatTooltipValue={formatTooltipValue}
                totalLabel={totalLabel}
              />
            }
          />

          {/* 棒グラフ描画設定 */}
          <Bar
            dataKey="totalValue"
            fill="url(#dashboardBarGradient)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
