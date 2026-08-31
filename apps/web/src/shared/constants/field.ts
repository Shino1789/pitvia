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

  // 整備履歴登録・詳細画面用
  VEHICLE: "対象車両",
  TITLE: "タイトル",
  MAINTENANCE_TYPE: "整備種別",
  WORK_DATE_FROM: "作業開始日",
  MILEAGE: "整備完了時の走行距離",
  MAINTENANCE_CATEGORY: "作業カテゴリ",
  WORK_CONTENT: "作業内容",
  PERFORMED_BY: "担当者名",
  LABOR_COST: "工賃",
  PART_NAME: "部品名",
  QUANTITY: "数量",
  UNIT_PRICE: "単価",
} as const;
