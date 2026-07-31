import { Button } from "@/shared/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PERIOD_TYPE, type PeriodType } from "@/shared/constants/period";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Props型定義
 */
interface DashboardChartHeaderProps {
  /** グラフのタイトル（例: "整備費用推移", "整備件数推移"） */
  title: string;
  /** 表示中の期間ラベル（例: "2024年1月 - 2024年12月"） */
  rangeLabel: string;
  /** 月次表示モードかどうか（true: 月次, false: 年次） */
  isMonthly: boolean;
  /** 過去期間へ移動可能かどうか */
  canMoveBackward: boolean;
  /** 未来期間へ移動可能かどうか */
  canMoveForward: boolean;
  /** 過去期間への移動ハンドラー */
  onPrev: () => void;
  /** 未来期間への移動ハンドラー */
  onNext: () => void;
  /** 集計単位（月次・年次）切り替えハンドラー */
  onChangePeriod: (period: PeriodType) => void;
}

/**
 * ダッシュボードグラフカードのヘッダーコンポーネント
 * （タイトル・期間表示・期間移動ナビゲーション・月次/年次切り替えボタン）
 *
 * @component
 */
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
      {/* 左側：タイトル & 期間ラベル */}
      <div>
        <CardTitle className="text-lg font-semibold text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {rangeLabel}
        </CardDescription>
      </div>

      {/* 右側：コントロールエリア（前後移動 ＋ 月次/年次トグル） */}
      <div className="flex items-center gap-2">
        {/* 前後期間移動ボタン群 */}
        <div className="flex items-center gap-1 mr-1">
          {/* 前の期間へ戻る */}
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
          {/* 次の期間へ進む */}
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

        {/* 集計単位（月次 / 年次）切り替えトグルグループ */}
        <div
          className="flex rounded-lg border border-border overflow-hidden"
          role="group"
          aria-label="集計単位"
        >
          {/* 月次表示ボタン */}
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
          {/* 年次表示ボタン */}
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
