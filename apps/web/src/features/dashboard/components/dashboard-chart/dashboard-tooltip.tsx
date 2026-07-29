import type { ChartPoint } from "@/features/dashboard/types/dashboard";
import type { PeriodType } from "@/shared/constants/period";
import {
  MAINTENANCE_TYPE_CHART_COLOR,
  MAINTENANCE_TYPE_LABELS,
} from "@/shared/constants/maintenance-type";
import { formatPeriodTooltip } from "@/shared/utils/format";

export interface DashboardTooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  periodType: PeriodType;
  formatTooltipValue: (value: number) => string;
  totalLabel: string;
}

export function DashboardTooltip({
  active,
  payload,
  periodType,
  formatTooltipValue,
  totalLabel,
}: DashboardTooltipProps) {
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
