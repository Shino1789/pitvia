"use client";

import type { DashboardChartResponse } from "@/features/dashboard/types/dashboard";
import { PERIOD_TYPE } from "@/shared/constants/period";
import { Card, CardContent } from "@/shared/ui/card";
import {
  formatCountAxis,
  formatCountFull,
  formatYenAxis,
  formatYenFull,
} from "@/shared/utils/format";
import { useDashboardChart } from "../../hooks/use-dashboard-chart";
import { DashboardBarChart } from "./dashboard-bar-chart";
import { DashboardChartHeader } from "./dashboard-chart-header";

export type ValueType = "currency" | "count";

interface DashboardChartProps {
  title: string;
  /** 初期表示用のグラフデータ */
  initialChart: DashboardChartResponse;
  valueType: ValueType;
  totalLabel: string;
}

const AXIS_FORMATTERS: Record<ValueType, (value: number) => string> = {
  currency: formatYenAxis,
  count: formatCountAxis,
};

const FULL_FORMATTERS: Record<ValueType, (value: number) => string> = {
  currency: formatYenFull,
  count: formatCountFull,
};

/**
 * ダッシュボード用 棒グラフカードコンポーネント
 *
 * @component
 */
export function DashboardChart({
  title,
  initialChart,
  valueType,
  totalLabel,
}: DashboardChartProps) {
  // フックから検索パラメータと取得結果を受け取る
  const { params, changeParams, data } = useDashboardChart({
    period: initialChart.periodType,
  });

  // 再取得データがあれば優先し、なければ初期データを使用
  const chartData = data ?? initialChart;
  const isMonthly = params.period === PERIOD_TYPE.MONTH;

  // startPeriod と endPeriod から表示用の期間ラベルを作成
  const rangeLabel =
    chartData.startPeriod && chartData.endPeriod
      ? `${chartData.startPeriod} 〜 ${chartData.endPeriod}`
      : "";

  const formatAxisValue = AXIS_FORMATTERS[valueType];
  const formatTooltipValue = FULL_FORMATTERS[valueType];

  return (
    <Card className="bg-card border-border h-full">
      <DashboardChartHeader
        title={title}
        rangeLabel={rangeLabel}
        isMonthly={isMonthly}
        canMoveBackward={chartData.canMoveBackward}
        canMoveForward={chartData.canMoveForward}
        onPrev={() =>
          changeParams((prev) => ({
            ...prev,
            endPeriod: chartData.startPeriod, // 前の期間の終了基準を設定
          }))
        }
        onNext={() =>
          changeParams((prev) => ({
            ...prev,
            endPeriod: chartData.endPeriod, // 次の期間の基準を設定
          }))
        }
        onChangePeriod={(period) =>
          changeParams({
            period,
            endPeriod: undefined, // 期間変更時は最新基準にリセット
          })
        }
      />
      <CardContent className="pt-0">
        <DashboardBarChart
          displayItems={chartData.items}
          periodType={params.period}
          totalLabel={totalLabel}
          formatAxisValue={formatAxisValue}
          formatTooltipValue={formatTooltipValue}
        />
      </CardContent>
    </Card>
  );
}
