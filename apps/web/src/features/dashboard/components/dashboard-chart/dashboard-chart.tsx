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
 * 指定された periodStr (例: "2026-07" や "2026") に対し、
 * 指定件数 (amount) 分だけ期間を進める/戻す計算ユーティリティ
 */
function shiftPeriod(periodStr: string, isMonthly: boolean, amount: number): string {
  if (isMonthly) {
    // "2026-07" 形式の計算
    const [yearStr, monthStr] = periodStr.split("-");
    const date = new Date(Number(yearStr), Number(monthStr) - 1 + amount, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  } else {
    // "2026" 形式の計算
    const y = Number(periodStr) + amount;
    return String(y);
  }
}

export function DashboardChart({
  title,
  initialChart,
  valueType,
  totalLabel,
}: DashboardChartProps) {
  const { params, changeParams, data } = useDashboardChart({
    period: initialChart.periodType,
  });

  const isInitialParam = params.period === initialChart.periodType && !params.endPeriod;
  const chartData = isInitialParam ? (data ?? initialChart) : data;

  const isMonthly = params.period === PERIOD_TYPE.MONTH;
  const size = chartData?.items?.length || 6; // データ件数（デフォルト6）

  const rangeLabel =
    chartData?.startPeriod && chartData?.endPeriod
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
        canMoveBackward={chartData?.canMoveBackward ?? false}
        canMoveForward={chartData?.canMoveForward ?? false}
        // 【過去へ移動】
        // 現在の開始期間 (startPeriod: 例 2026-02) の「1か月前 (2026-01)」を次の endPeriod に指定
        onPrev={() => {
          if (!chartData?.startPeriod) return;
          const newEndPeriod = shiftPeriod(chartData.startPeriod, isMonthly, -1);
          changeParams((prev) => ({
            ...prev,
            endPeriod: newEndPeriod,
          }));
        }}
        // 【未来へ移動】
        // 現在の終了期間 (endPeriod: 例 2026-07) の「6か月後 (2027-01)」を次の endPeriod に指定
        onNext={() => {
          if (!chartData?.endPeriod) return;
          const newEndPeriod = shiftPeriod(chartData.endPeriod, isMonthly, size);
          changeParams((prev) => ({
            ...prev,
            endPeriod: newEndPeriod,
          }));
        }}
        onChangePeriod={(period) =>
          changeParams({
            period,
            endPeriod: undefined, // 月次/年次の切り替え時は最新にリセット
          })
        }
      />
      <CardContent className="pt-0">
        {chartData && (
          <DashboardBarChart
            displayItems={chartData.items}
            periodType={params.period}
            totalLabel={totalLabel}
            formatAxisValue={formatAxisValue}
            formatTooltipValue={formatTooltipValue}
          />
        )}
      </CardContent>
    </Card>
  );
}
