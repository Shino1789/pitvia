import { PERIOD_TYPE, type PeriodType } from "@/shared/constants/period";

/**
 * グラフ縦軸用: 金額を万単位で簡潔に整形
 * (例: 150000 → "15万", 500000 → "50万", 0 → "0")
 *
 * @param value 金額数値
 * @returns 整形後の金額文字列
 */
export function formatYenAxis(value: number): string {
  if (value === 0) return "0";
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value % 10000 === 0 ? 0 : 1)}万`;
  }
  return value.toLocaleString();
}

/**
 * ツールチップ用: 金額をフル桁のカンマ区切りで整形
 * (例: 12800 → "¥12,800")
 *
 * @param value 金額数値
 * @returns 整形後の金額文字列
 */
export function formatYenFull(value: number): string {
  return `¥${value.toLocaleString()}`;
}

/**
 * グラフ縦軸用: 件数を「件」付き数値文字列に整形
 * (例: 30 → "30件", 0 → "0")
 *
 * @param value 件数数値
 * @returns 整形後の件数文字列
 */
export function formatCountAxis(value: number): string {
  if (value === 0) return "0";
  return `${value}件`;
}

/**
 * ツールチップ用: 件数を「件」付きのカンマ区切りで整形
 * (例: 30 → "30件")
 *
 * @param value 件数数値
 * @returns 整形後の件数表示文字列
 */
export function formatCountFull(value: number): string {
  return `${value.toLocaleString()}件`;
}

/**
 * 集計期間をグラフX軸用ラベルに整形
 * (例: 月次 "2026-06" → "6月", 年次 "2026" → "2026年")
 *
 * @param period 期間文字列 ("YYYY-MM" または "YYYY")
 * @param periodType 集計単位（月次・年次）
 * @returns X軸表示用テキスト
 */
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

/**
 * 集計期間をツールチップ見出し用に整形
 * (例: 月次 "2026-06" → "2026年6月", 年次 "2026" → "2026年")
 *
 * @param period 期間文字列 ("YYYY-MM" または "YYYY")
 * @param periodType 集計単位（月次・年次）
 * @returns ツールチップ見出しテキスト
 */
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

/**
 * 表示範囲ラベルをスラッシュ区切りに整形
 * (例: "2025-07" 〜 "2026-06" → "2025/07 〜 2026/06")
 *
 * @param from 開始期間文字列
 * @param to 終了期間文字列
 * @returns 整形後の範囲文字列
 */
export function formatPeriodRangeLabel(from: string, to: string): string {
  const normalize = (p: string) => p.replace("-", "/");
  return `${normalize(from)} 〜 ${normalize(to)}`;
}

/**
 * 対象オーナー名を伴う画面タイトルを組み立てる
 * (例: "田中 健太", "整備履歴一覧" → "田中 健太 様の整備履歴一覧")
 *
 * 車両一覧・整備履歴一覧・整備履歴登録・整備履歴詳細の各画面で、SHOPが顧客を対象に
 * 操作している場合のヘッダータイトル表記を統一するために使用する。
 *
 * @param ownerUserName 対象オーナー名（自分自身の場合はnull/undefined）
 * @param baseTitle     基本タイトル
 * @returns 整形後のタイトル
 */
export function formatOwnerScopedTitle(
  ownerUserName: string | null | undefined,
  baseTitle: string,
): string {
  return ownerUserName ? `${ownerUserName} 様の${baseTitle}` : baseTitle;
}

/**
 * 整備作業期間の表示整形。
 * 単日 (workDateTo が null または開始日と同一) の場合は1つの日付のみ表示し、
 * 複数日にまたがる場合は "2026/04/11 〜 2026/04/18" 形式で表示。
 *
 * @param workDateFrom 作業開始日 ("YYYY-MM-DD")
 * @param workDateTo 作業完了日 ("YYYY-MM-DD" | null)
 * @returns 整形後の作業期間文字列
 */
export function formatWorkPeriod(
  workDateFrom: string,
  workDateTo: string | null,
): string {
  const toSlash = (d: string) => d.replaceAll("-", "/");
  const from = toSlash(workDateFrom);

  // 完了日が存在しない、または開始日と同一（単日作業）の場合は開始日のみ
  if (!workDateTo || workDateTo === workDateFrom) {
    return from;
  }
  return `${from} 〜 ${toSlash(workDateTo)}`;
}

/**
 * ISO-8601形式の日時文字列を「YYYY/MM/DD HH:mm」形式に整形
 * (例: "2026-06-20T18:00:00Z" → "2026/06/20 18:00"、ローカルタイムゾーンで表示)
 *
 * @param isoDateTime ISO-8601形式の日時文字列
 * @returns 整形後の日時文字列
 */
export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 招待コード等の有効期限までの残り時間を「残り23時間」「残り5分」形式に整形
 * (例: 期限まで23時間15分 → "残り23時間"、期限切れ → "期限切れ")
 *
 * 固定値の逆算ではなく、常にAPIから受け取った`expiresAt`を基準に算出する。
 *
 * @param expiresAt 有効期限のISO-8601形式日時文字列
 * @returns 残り時間の表示文字列
 */
export function formatRemainingTime(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();

  if (diffMs <= 0) {
    return "期限切れ";
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours >= 1) {
    return `残り${hours}時間`;
  }

  const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
  return `残り${minutes}分`;
}
