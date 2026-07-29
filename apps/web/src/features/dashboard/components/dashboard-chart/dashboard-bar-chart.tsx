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

interface DashboardBarChartProps {
  displayItems: ChartPoint[];
  periodType: PeriodType;
  totalLabel: string;
  formatAxisValue: (value: number) => string;
  formatTooltipValue: (value: number) => string;
}

export function DashboardBarChart({
  displayItems,
  periodType,
  totalLabel,
  formatAxisValue,
  formatTooltipValue,
}: DashboardBarChartProps) {
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
              <DashboardTooltip
                periodType={periodType}
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
  );
}
