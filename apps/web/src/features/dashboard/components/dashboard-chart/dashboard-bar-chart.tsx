import { DASHBOARD_AXIS_CONFIG } from "@/features/dashboard/constants/dashboard-chart";
import type { ChartPoint } from "@/features/dashboard/types/dashboard";
import type { PeriodType } from "@/shared/constants/period";
import { PERIOD_TYPE } from "@/shared/constants/period";
import { ChartContainer } from "@/shared/ui/chart";
import { calculateAxisMax } from "@/shared/utils/chart";
import { formatPeriodAxis } from "@/shared/utils/format";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType } from "./dashboard-chart";
import { DashboardTooltip } from "./dashboard-tooltip";

/**
 * Props型定義
 */
interface DashboardBarChartProps {
  /** グラフ描画用データ配列 */
  displayItems: ChartPoint[];
  /** 表示期間の種別（"monthly" | "yearly" など） */
  periodType: PeriodType;
  /** 表示する数値の種別（"currency" | "count"） */
  valueType: ValueType;
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
  valueType,
  totalLabel,
  formatAxisValue,
  formatTooltipValue,
}: DashboardBarChartProps) {
  // ChartContainer に渡すカラー・ラベル等の設定
  const chartConfig = {
    totalValue: { label: totalLabel, color: "var(--primary)" },
  };

  // 表示中のデータ一覧から最大の totalValue を抽出
  const maxTotalValue = Math.max(
    0,
    ...displayItems.map((item) => item.totalValue ?? 0),
  );

  // 期間（月次/年次）の判定
  const isMonthly = periodType === PERIOD_TYPE.MONTH;
  const configKey = isMonthly ? "monthly" : "yearly";

  // 設定値の取得 (DASHBOARD_AXIS_CONFIG から取得)
  const { defaultMax, step } = DASHBOARD_AXIS_CONFIG[valueType][configKey];

  // 軸スケールの最大値を算出
  const domainMax = calculateAxisMax(maxTotalValue, defaultMax, step);

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
            domain={[0, domainMax]}
            tickCount={6}
            allowDecimals={false} // 件数・金額共に目盛り上の小数は不使用
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
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
