import { Button } from "@/shared/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PERIOD_TYPE, type PeriodType } from "@/shared/constants/period";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardChartHeaderProps {
  title: string;
  rangeLabel: string;
  isMonthly: boolean;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  onPrev: () => void;
  onNext: () => void;
  onChangePeriod: (period: PeriodType) => void;
}

export function DashboardChartHeader({
  title,
  rangeLabel,
  isMonthly,
  canMoveBackward,
  canMoveForward,
  onPrev,
  onNext,
  onChangePeriod,
}: DashboardChartHeaderProps) {
  return (
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
            onClick={onPrev}
            disabled={!canMoveBackward}
            aria-label="過去の期間を表示"
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
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
            onClick={() => onChangePeriod(PERIOD_TYPE.MONTH)}
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
            onClick={() => onChangePeriod(PERIOD_TYPE.YEAR)}
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
  );
}
