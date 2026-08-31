/**
 * フォームの閲覧モード用の読み取り専用テキスト表示
 *
 * 編集モードでは入力欄（Input/Select等）として表示するフィールドを、
 * 閲覧モードでは装飾を排したプレーンテキストとして統一表示するために使用する
 *
 * @component
 */
export function ReadOnlyValue({
  value,
  multiline = false,
}: {
  value: string | number | undefined | null;
  multiline?: boolean;
}) {
  return (
    <p
      className={
        multiline
          ? "min-h-24 py-2 text-sm whitespace-pre-line text-foreground"
          : "py-2 text-sm text-foreground"
      }
    >
      {value || value === 0 ? value : "-"}
    </p>
  );
}
