/** 招待コードのハイフン区切り1ブロックあたりの文字数（Spring: ShopInviteCodeConstants.CODE_SEGMENT_LENGTH） */
export const INVITE_CODE_SEGMENT_LENGTH = 4;

/** 招待コードのブロック数（Spring: ShopInviteCodeConstants.CODE_SEGMENT_COUNT） */
export const INVITE_CODE_SEGMENT_COUNT = 2;

/** ハイフンを除いた招待コードの文字数 */
const INVITE_CODE_LENGTH =
  INVITE_CODE_SEGMENT_LENGTH * INVITE_CODE_SEGMENT_COUNT;

/**
 * 招待コード入力欄の値を「XXXX-XXXX」形式へ整形する
 *
 * 全角英数字は半角へ、小文字は大文字へ変換し、英数字以外（ハイフン・空白等）は一旦すべて除去
 * したうえで、ハイフンを再挿入する。そのため、ショップ側でコピーした「XHVQ-2XCK」をそのまま
 * ペーストしても、ハイフンが二重になったり前後の空白が残ったりしない。
 *
 * @param raw      入力欄の現在の値（ペースト・IME確定直後の値を含む）
 * @param previous 直前に表示していた整形済みの値（文字数が増える入力かどうかの判定に使用）
 * @returns 整形後の値（最大でハイフンを含めて9文字）
 */
export function formatInviteCode(raw: string, previous = ""): string {
  const alphanumeric = raw
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, INVITE_CODE_LENGTH);

  // 2ブロック目に入力が続いている場合は、常にハイフンで区切る
  if (alphanumeric.length > INVITE_CODE_SEGMENT_LENGTH) {
    return `${alphanumeric.slice(0, INVITE_CODE_SEGMENT_LENGTH)}-${alphanumeric.slice(INVITE_CODE_SEGMENT_LENGTH)}`;
  }

  // 1ブロック目を入力し終えた直後（増える入力の場合のみ）、続けて入力できるようハイフンを付与する
  if (
    alphanumeric.length === INVITE_CODE_SEGMENT_LENGTH &&
    alphanumeric.length > previous.replace(/-/g, "").length
  ) {
    return `${alphanumeric}-`;
  }

  return alphanumeric;
}
