/**
 * 顧客一覧における連携車両のサマリー情報
 * Spring: CustomerVehicleSummary
 */
export interface CustomerVehicleSummary {
  vehicleId: string;
  /** ツールチップ表示等に使う車種名 */
  vehicleName: string;
  /** 車両画像の公開URL（未設定の場合はnull） */
  imageUrl: string | null;
}

/**
 * 顧客一覧の1件分のデータ
 * Spring: CustomerSummary
 */
export interface CustomerSummary {
  ownerId: string;
  ownerName: string;
  /** 顧客のユーザーアイコン公開URL（未設定の場合はnull） */
  ownerIconUrl: string | null;
  /**
   * ログインショップ自身が実施した整備履歴のうち、最も新しい作業開始日（"YYYY-MM-DD"）
   *
   * 該当する整備履歴が1件も無い場合はnull。
   */
  lastMaintenanceDate: string | null;
  /** このショップと連携している顧客の車両のうち最大3件 */
  linkedVehicles: CustomerVehicleSummary[];
  /** 連携車両の総数（linkedVehiclesは先頭3件のみ） */
  linkedVehicleCount: number;
}

/**
 * 顧客一覧取得APIリクエストのクエリパラメータ
 */
export interface CustomerListParams {
  /** 顧客名（ユーザー名）の部分一致キーワード（任意） */
  keyword?: string;
  /** ページ番号（1始まり、未指定時は1） */
  page?: number;
  /** 1ページあたりの件数（未指定時は20） */
  size?: number;
}
