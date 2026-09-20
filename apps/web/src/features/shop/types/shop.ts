/**
 * ショップ招待コード
 * Spring: ShopInviteCodeResponse
 */
export interface ShopInviteCode {
  code: string;
  /** ISO-8601形式の有効期限日時文字列 */
  expiresAt: string;
}

/**
 * ショップ一覧における連携車両のサマリー情報
 * Spring: ShopLinkedVehicleSummary
 */
export interface ShopLinkedVehicleSummary {
  vehicleId: string;
  /** 車種名 */
  vehicleName: string;
  /** 車両画像の公開URL（未設定の場合はnull） */
  imageUrl: string | null;
}

/**
 * ショップ一覧の1件分のデータ（OWNER向け）
 * Spring: ShopSummary
 */
export interface ShopSummary {
  shopId: string;
  shopName: string;
  /** ショップのユーザーアイコン公開URL（未設定の場合はnull） */
  shopIconUrl: string | null;
  /** 住所（未登録の場合はnull） */
  address: string | null;
  /** 電話番号（未登録の場合はnull） */
  phoneNumber: string | null;
  /** このショップと連携している自分の車両のうち最大3件 */
  linkedVehicles: ShopLinkedVehicleSummary[];
  /** 連携車両の総数（linkedVehiclesは先頭3件のみ） */
  linkedVehicleCount: number;
}

/**
 * ショップ一覧取得APIリクエストのクエリパラメータ
 */
export interface ShopListParams {
  /** ショップ名（ユーザー名）の部分一致キーワード（任意） */
  keyword?: string;
  /** ページ番号（1始まり、未指定時は1） */
  page?: number;
  /** 1ページあたりの件数（未指定時は20） */
  size?: number;
}

/**
 * ショップ連携（招待コード入力）リクエスト
 * Spring: ShopLinkRequest
 */
export interface ShopLinkRequest {
  /** 連携対象の車両ID（自分が所有する車両） */
  vehicleId: string;
  /** ショップが発行した招待コード */
  inviteCode: string;
}

/**
 * ショップ連携成功時のレスポンス
 * Spring: ShopLinkResponse
 */
export interface ShopLinkResponse {
  shopId: string;
  shopName: string;
  vehicleId: string;
  /** 連携ステータス（ベータ版では常にAPPROVED） */
  status: string;
  /** ISO-8601形式の連携承認日時文字列 */
  approvedAt: string;
}
