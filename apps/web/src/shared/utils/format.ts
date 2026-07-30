import { PERIOD_TYPE, type PeriodType } from "@/shared/constants/period";

/** グラフ縦軸用: 金額を万単位で簡潔に (例: ¥1.5万 / ¥5,000) */
export function formatYenAxis(value: number): string {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(value % 10000 === 0 ? 0 : 1)}万`;
  }
  return `¥${value.toLocaleString()}`;
}

/** ツールチップ用: 金額をカンマ区切りで (例: ¥12,800) */
export function formatYenFull(value: number): string {
  return `¥${value.toLocaleString()}`;
}

/** グラフ縦軸用: 件数 (例: 30) */
export function formatCountAxis(value: number): string {
  return `${value}`;
}

/** ツールチップ用: 件数 (例: 30件) */
export function formatCountFull(value: number): string {
  return `${value.toLocaleString()}件`;
}

/** 集計期間を軸ラベルに整形 ("2026-06" → "6月" / "2026" → "2026") */
export function formatPeriodAxis(
  period: string,
  periodType: PeriodType,
): string {
  if (periodType === PERIOD_TYPE.MONTH) {
    const parts = period.split("-");
    return `${parseInt(parts[1], 10)}月`;
  }
  return `${period}年`;
}

/** 集計期間をツールチップ見出しに整形 ("2026-06" → "2026年6月" / "2026" → "2026年") */
export function formatPeriodTooltip(
  period: string,
  periodType: PeriodType,
): string {
  if (periodType === PERIOD_TYPE.MONTH) {
    const parts = period.split("-");
    return `${parts[0]}年${parseInt(parts[1], 10)}月`;
  }
  return `${period}年`;
}

/** 表示範囲ラベル ("2025-07" 〜 "2026-06" → "2025/07 〜 2026/06") */
export function formatPeriodRangeLabel(from: string, to: string): string {
  const normalize = (p: string) => p.replace("-", "/");
  return `${normalize(from)} 〜 ${normalize(to)}`;
}

/**
 * 整備作業期間の表示整形。
 * 単日 (workDateTo が null または開始日と同一) の場合は1つの日付のみ、
 * 複数日にまたがる場合は "2026/04/11 〜 2026/04/18" 形式。
 */
export function formatWorkPeriod(
  workDateFrom: string,
  workDateTo: string | null,
): string {
  const toSlash = (d: string) => d.replaceAll("-", "/");
  const from = toSlash(workDateFrom);
  if (!workDateTo || workDateTo === workDateFrom) {
    return from;
  }
  return `${from} 〜 ${toSlash(workDateTo)}`;
}
