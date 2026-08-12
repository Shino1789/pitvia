/**
 * バリデーションや画面表示で共通利用するフィールド名定義
 */
export const FIELD = {
  EMAIL: "メールアドレス",
  PASSWORD: "パスワード",
  USER_NAME: "ユーザー名",
  CONFIRM_PASSWORD: "確認用パスワード",

  // 車両登録・詳細画面用
  MODEL_NAME: "車名",
  MANUFACTURER: "メーカー",
  MODEL_CODE: "型式",
  ENGINE_CODE: "エンジン型式",
  MODEL_YEAR: "年式",
  LICENSE_PLATE: "ナンバープレート",
  CURRENT_MILEAGE: "走行距離",
  TRANSMISSION_TYPE: "トランスミッション",
  DRIVE_TYPE: "駆動方式",
} as const;
