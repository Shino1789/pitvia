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

/**
 * グラフで扱う数値データの種別
 * - currency: 金額（円表記）
 * - count: 件数（件表記）
 */
export type ValueType = "currency" | "count";

/**
 * Props型定義
 */
interface DashboardChartProps {
  /** グラフのタイトル（例: "整備費用推移"） */
  title: string;
  /** SSRまたは初回取得時の初期データ */
  initialChart?: DashboardChartResponse;
  /** 表示する数値の種別（"currency" | "count"） */
  valueType: ValueType;
  /** 合計値のラベル名（例: "合計費用", "整備件数"） */
  totalLabel: string;
}

/**
 * 軸目盛り用のフォーマッター定義マップ
 */
const AXIS_FORMATTERS: Record<ValueType, (value: number) => string> = {
  currency: formatYenAxis,
  count: formatCountAxis,
};

/**
 * ツールチップ用の詳細数値フォーマッター定義マップ
 */
const FULL_FORMATTERS: Record<ValueType, (value: number) => string> = {
  currency: formatYenFull,
  count: formatCountFull,
};

/**
 * 指定された periodStr (例: "2026-07" や "2026") に対し、
 * 指定件数分だけ期間を進める/戻す計算ユーティリティ
 *
 * @param periodStr 基準となる期間文字列
 * @param isMonthly 月次計算か否か（true: 月指定, false: 年指定）
 * @param amount 加減算する数（負数で過去、正数で未来）
 * @returns 計算後の期間文字列
 */
function shiftPeriod(
  periodStr: string,
  isMonthly: boolean,
  amount: number,
): string {
  if (isMonthly) {
    // "yyyy-MM" 形式の計算
    const [yearStr, monthStr] = periodStr.split("-");
    const date = new Date(Number(yearStr), Number(monthStr) - 1 + amount, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  } else {
    // "yyyy" 形式の計算
    const y = Number(periodStr) + amount;
    return String(y);
  }
}

/**
 * ダッシュボード用グラフ統合コンポーネント
 *
 * @component
 */
export function DashboardChart({
  title,
  initialChart,
  valueType,
  totalLabel,
}: DashboardChartProps) {
  // initialChart が未定義の場合はデフォルト値として PERIOD_TYPE.MONTH ("MONTH") を採用
  const initialPeriod = initialChart?.periodType ?? PERIOD_TYPE.MONTH;

  // 期間切り替え・パラメーター管理フック
  const { params, changeParams, data } = useDashboardChart({
    period: initialPeriod,
  });

  // 初期状態（パラメータ未変更時）は initialChart を優先使用
  const isInitialParam = params.period === initialPeriod && !params.endPeriod;
  const chartData = isInitialParam ? (data ?? initialChart) : data;

  // 月次フラグと表示件数の判定
  const isMonthly = params.period === PERIOD_TYPE.MONTH;
  const size = chartData?.items?.length || 6; // データ件数（デフォルト6）

  // ヘッダーに表示する期間範囲ラベル文字列
  const rangeLabel =
    chartData?.startPeriod && chartData?.endPeriod
      ? `${chartData.startPeriod} 〜 ${chartData.endPeriod}`
      : "";

  // 数値種別に応じたフォーマット関数の取得
  const formatAxisValue = AXIS_FORMATTERS[valueType];
  const formatTooltipValue = FULL_FORMATTERS[valueType];

  return (
    <Card className="bg-card border-border h-full">
      {/* グラフヘッダー */}
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
          const newEndPeriod = shiftPeriod(
            chartData.startPeriod,
            isMonthly,
            -1,
          );
          changeParams((prev) => ({
            ...prev,
            endPeriod: newEndPeriod,
          }));
        }}
        // 【未来へ移動】
        // 現在の終了期間 (endPeriod: 例 2026-07) の「6か月後 (2027-01)」を次の endPeriod に指定
        onNext={() => {
          if (!chartData?.endPeriod) return;
          const newEndPeriod = shiftPeriod(
            chartData.endPeriod,
            isMonthly,
            size,
          );
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

      {/* グラフメイン描画エリア */}
      <CardContent className="pt-0">
        {chartData && (
          <DashboardBarChart
            key={`${valueType}-${params.period}`}
            displayItems={chartData.items ?? []}
            periodType={params.period}
            valueType={valueType}
            totalLabel={totalLabel}
            formatAxisValue={formatAxisValue}
            formatTooltipValue={formatTooltipValue}
          />
        )}
      </CardContent>
    </Card>
  );
}
