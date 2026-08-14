import type { PageResponse } from "@/shared/types/response";
import type { MaintenanceType } from "@/shared/constants/maintenance-type";

/**
 * 整備履歴一覧の並び替え条件
 * Spring: MaintenanceRecordSort
 */
export const MAINTENANCE_RECORD_SORT = {
  WORK_DATE_DESC: "WORK_DATE_DESC",
  WORK_DATE_ASC: "WORK_DATE_ASC",
} as const;

export type MaintenanceRecordSort =
  (typeof MAINTENANCE_RECORD_SORT)[keyof typeof MAINTENANCE_RECORD_SORT];

/**
 * 整備履歴一覧の対象オーナー情報
 *
 * ownerId指定時、またはvehicleId指定時で対象車両が自分の所有でない場合のみ設定される。
 * Spring: VehicleOwnerSummary（整備履歴一覧APIでも同じ型を再利用）
 */
export interface MaintenanceRecordOwnerSummary {
  id: string;
  userName: string;
}

/**
 * 整備履歴一覧の1件分のデータ
 * Spring: MaintenanceRecordSummary
 */
export interface MaintenanceRecordSummary {
  id: string;
  vehicleId: string;
  vehicleModelName: string;
  vehicleModelCode: string | null;
  maintenanceType: MaintenanceType;
  title: string;
  workDateFrom: string;
  /** 単日作業の場合はnull */
  workDateTo: string | null;
  mileage: number;
  /** 整備にかかった総費用（工賃＋部品代の合算値） */
  totalCost: number;
  /** DIYの場合はnull */
  shopName: string | null;
}

/**
 * 整備履歴一覧取得APIリクエストのクエリパラメータ
 */
export interface MaintenanceRecordListParams {
  /** 対象車両ID（任意） */
  vehicleId?: string;
  /** 対象オーナーのユーザーID（任意、SHOP専用） */
  ownerId?: string;
  /** 整備種別による絞り込み（任意、複数指定可） */
  maintenanceType?: MaintenanceType[];
  /** 整備タイトルの部分一致キーワード（任意） */
  keyword?: string;
  /** 並び替え条件（未指定時はWORK_DATE_DESC） */
  sort?: MaintenanceRecordSort;
  /** ページ番号（1始まり、未指定時は1） */
  page?: number;
  /** 1ページあたりの件数（未指定時は20） */
  size?: number;
}

/**
 * 整備履歴一覧取得レスポンス
 * Spring: MaintenanceRecordListResponse
 */
export interface MaintenanceRecordListResponse {
  /** 対象オーナー情報（自分自身の一覧取得時はnull） */
  owner: MaintenanceRecordOwnerSummary | null;
  /** 整備履歴一覧（ページング付き） */
  records: PageResponse<MaintenanceRecordSummary>;
}
