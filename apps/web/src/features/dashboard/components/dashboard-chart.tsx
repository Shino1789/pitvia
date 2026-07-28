"use client";

import { useState } from "react";
import type { DashboardChartResponse } from "@/features/dashboard/types/dashboard";
import {
  MAINTENANCE_TYPE_CHART_COLOR,
  MAINTENANCE_TYPE_LABELS,
} from "@/shared/constants/maintenance-type";
import { PERIOD_TYPE, type PeriodType } from "@/shared/constants/period";
import {
  formatCountAxis,
  formatCountFull,
  formatPeriodAxis,
  formatPeriodRangeLabel,
  formatPeriodTooltip,
  formatYenAxis,
  formatYenFull,
} from "@/shared/utils/format";
import type { ChartPoint } from "@/features/dashboard/types/dashboard";
import {
  ownerDashboardMockMonthlyChart,
  ownerDashboardMockYearlyChart,
  shopDashboardMockMonthlyChart,
  shopDashboardMockYearlyChart,
} from "@/features/dashboard/mock/mock-data";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { ChartContainer } from "@/shared/ui/chart";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** 一度に表示する月数の上限（月次表示時のスクロール枠） */
const VISIBLE_COUNT = 6;

/** 集計値の種別。関数はサーバー→クライアントへ渡せないため文字列で受け取る */
type ValueType = "currency" | "count";

interface DashboardChartProps {
  /** カード見出し（例: 整備費用推移 / 整備件数推移） */
  title: string;
  /** バックエンド API レスポンスと同構造のグラフデータ */
  chart: DashboardChartResponse;
  /** 値の種別（金額 / 件数）。軸・ツールチップの整形に使用 */
  valueType: ValueType;
  /** ツールチップの合計ラベル（例: 総額 / 総件数） */
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

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  periodType: PeriodType;
  formatTooltipValue: (value: number) => string;
  totalLabel: string;
}

function CustomTooltip({
  active,
  payload,
  periodType,
  formatTooltipValue,
  totalLabel,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;
  const breakdown = [...point.breakdown]
    .filter((b) => b.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">
        {formatPeriodTooltip(point.period, periodType)}
      </p>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-primary font-medium">{totalLabel}</span>
        <span className="font-semibold text-foreground">
          {formatTooltipValue(point.totalValue)}
        </span>
      </div>
      <div className="border-t border-border my-2" />
      <div className="space-y-1 text-sm">
        {breakdown.map((item) => (
          <div key={item.category} className="flex justify-between gap-4">
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
            <span className="text-foreground">
              {formatTooltipValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardChart({
  title,
  chart: initialChart,
  valueType,
  totalLabel,
}: DashboardChartProps) {
  const [isMonthly, setIsMonthly] = useState(
    initialChart.periodType === PERIOD_TYPE.MONTH,
  );
  // モック環境用の表示開始インデックス（月次データの場合、直近6か月分を初期表示）
  const [scrollIndex, setScrollIndex] = useState(
    Math.max(0, initialChart.items.length - VISIBLE_COUNT),
  );

  // モック段階での月次/年次切り替え用データ参照
  // (API接続時は React Query の API 再取得結果に置き換わります)
  const isCurrency = valueType === "currency";
  const monthlyData = isCurrency
    ? ownerDashboardMockMonthlyChart
    : shopDashboardMockMonthlyChart;
  const yearlyData = isCurrency
    ? ownerDashboardMockYearlyChart
    : shopDashboardMockYearlyChart;

  const activeChart = isMonthly ? monthlyData : yearlyData;

  const formatAxisValue = AXIS_FORMATTERS[valueType];
  const formatTooltipValue = FULL_FORMATTERS[valueType];

  // モック用のデータ切り出し処理（月次は直近6本切り出し、年次は全件表示）
  const displayItems = isMonthly
    ? activeChart.items.slice(scrollIndex, scrollIndex + VISIBLE_COUNT)
    : activeChart.items;

  const canMoveBackward = isMonthly
    ? scrollIndex > 0
    : activeChart.canMoveBackward;
  const canMoveForward = isMonthly
    ? scrollIndex + VISIBLE_COUNT < activeChart.items.length
    : activeChart.canMoveForward;

  const handlePrev = () => {
    if (isMonthly && canMoveBackward) {
      setScrollIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    if (isMonthly && canMoveForward) {
      setScrollIndex((prev) =>
        Math.min(activeChart.items.length - VISIBLE_COUNT, prev + 1),
      );
    }
  };

  const handleTogglePeriod = (monthly: boolean) => {
    setIsMonthly(monthly);
    if (monthly) {
      setScrollIndex(Math.max(0, monthlyData.items.length - VISIBLE_COUNT));
    }
  };

  const startPeriod = displayItems[0]?.period ?? activeChart.startPeriod ?? "";
  const endPeriod =
    displayItems[displayItems.length - 1]?.period ??
    activeChart.endPeriod ??
    "";

  const rangeLabel = isMonthly
    ? formatPeriodRangeLabel(startPeriod, endPeriod)
    : `${startPeriod} 〜 ${endPeriod}`;

  const chartConfig = {
    totalValue: { label: totalLabel, color: "var(--primary)" },
  };

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {rangeLabel}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={!canMoveBackward}
              aria-label="過去の期間を表示"
              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={!canMoveForward}
              aria-label="未来の期間を表示"
              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div
            className="flex rounded-lg border border-border overflow-hidden"
            role="group"
            aria-label="集計単位"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTogglePeriod(true)}
              aria-pressed={isMonthly}
              className={`rounded-none px-4 h-8 ${
                isMonthly
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              月次
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTogglePeriod(false)}
              aria-pressed={!isMonthly}
              className={`rounded-none px-4 h-8 ${
                !isMonthly
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              年次
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayItems}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="dashboardBarGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.6}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value: string) =>
                  formatPeriodAxis(value, activeChart.periodType)
                }
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={formatAxisValue}
                dx={-5}
                width={55}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={
                  <CustomTooltip
                    periodType={activeChart.periodType}
                    formatTooltipValue={formatTooltipValue}
                    totalLabel={totalLabel}
                  />
                }
              />
              <Bar
                dataKey="totalValue"
                fill="url(#dashboardBarGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
