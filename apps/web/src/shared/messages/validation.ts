/**
 * アプリケーション共通のバリデーションエラーメッセージ定義
 */
export const VALIDATION_MESSAGES = {
  /**
   * 必須入力チェックのエラーメッセージ
   *
   * @param field フィールド名
   */
  required: (field: string) => `${field}は必須です`,

  /**
   * 最小文字数チェックのエラーメッセージ
   *
   * @param field フィールド名
   * @param min 最小文字数
   */
  minLength: (field: string, min: number) =>
    `${field}は${min}文字以上で入力してください`,

  /**
   * 最大文字数チェックのエラーメッセージ
   *
   * @param field フィールド名
   * @param max 最大文字数
   */
  maxLength: (field: string, max: number) =>
    `${field}は${max}文字以内で入力してください`,

  /**
   * フォーマットチェックのエラーメッセージ
   *
   * @param field フィールド名
   */
  invalidFormat: (field: string) => `${field}の形式が正しくありません`,

  /**
   * 最小値チェックのエラーメッセージ
   *
   * @param field フィールド名
   * @param min 最小値
   */
  minValue: (field: string, min: number) =>
    `${field}は${min}以上で入力してください`,

  /**
   * 最大値チェックのエラーメッセージ
   *
   * @param field フィールド名
   * @param max 最大値
   */
  maxValue: (field: string, max: number) =>
    `${field}は${max}以下で入力してください`,

  /** パスワードの複雑性ルール（英数字混在）のエラーメッセージ */
  passwordRule: "パスワードは英字と数字を少なくとも1文字ずつ含めてください",

  /** パスワード一致チェックのエラーメッセージ */
  passwordMismatch: "パスワードが一致しません",

  /** 利用規約同意チェックボックスのエラーメッセージ */
  agreeTermsRequired: "利用規約とプライバシーポリシーへの同意が必要です",
} as const;
