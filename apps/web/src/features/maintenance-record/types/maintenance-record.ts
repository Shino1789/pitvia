import type { PageResponse } from "@/shared/types/response";
import type { MaintenanceType } from "@/shared/constants/maintenance-type";
import type { MaintenanceCategory } from "@/shared/constants/maintenance-category";

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

/**
 * 交換部品の状態
 * Spring: PartCondition（maintenance.enums.PartCondition）
 */
export const PART_CONDITION = {
  NEW: "NEW",
  USED: "USED",
  REBUILT: "REBUILT",
} as const;

export type PartCondition = (typeof PART_CONDITION)[keyof typeof PART_CONDITION];

/**
 * 交換部品の状態の表示用ラベルマップ
 */
export const PART_CONDITION_LABELS: Record<PartCondition, string> = {
  [PART_CONDITION.NEW]: "新品",
  [PART_CONDITION.USED]: "中古",
  [PART_CONDITION.REBUILT]: "リビルト品",
};

/**
 * 交換部品登録・更新リクエスト
 * Spring: PartRequest
 */
export interface PartRequest {
  /**
   * 部品ID（更新時のみ使用）
   *
   * 既存の部品を更新する場合はそのID、新規追加する場合はundefined（登録時は常に未指定）。
   */
  id?: number;
  /** 部品の状態（任意項目） */
  partCondition: PartCondition | null;
  partName: string;
  manufacturerName: string | null;
  partModelNumber: string | null;
  quantity: number;
  unitPrice: number;
}

/**
 * 整備作業明細登録・更新リクエスト
 * Spring: WorkItemRequest
 */
export interface WorkItemRequest {
  /**
   * 作業項目ID（更新時のみ使用）
   *
   * 既存の作業項目を更新する場合はそのID、新規追加する場合はundefined（登録時は常に未指定）。
   */
  id?: number;
  maintenanceCategory: MaintenanceCategory;
  workContent: string;
  performedBy: string;
  laborCost: number;
  /**
   * 既存の整備画像を削除するかどうか（更新時のみ使用。未指定時はfalse扱い）
   *
   * 新しい画像ファイル（`workItemImage_{index}`パート）が指定されている場合は、
   * この値に関わらずファイルの差し替えが優先される。
   */
  removeImage?: boolean;
  /** 交換部品リスト（部品を伴わない作業項目の場合は空配列） */
  parts: PartRequest[];
}

/**
 * 整備履歴登録リクエスト
 * Spring: CreateMaintenanceRecordRequest
 */
export interface CreateMaintenanceRecordRequest {
  vehicleId: string;
  title: string;
  maintenanceType: MaintenanceType;
  workDateFrom: string;
  /** 任意項目。指定する場合はworkDateFrom以降の日付であること */
  workDateTo: string | null;
  mileage: number;
  remarks: string | null;
  /** 紐づく作業項目リスト（1件以上必須） */
  workItems: WorkItemRequest[];
}

/**
 * 整備履歴更新リクエスト
 *
 * 対象車両（`vehicleId`）は登録後に変更できないため、{@link CreateMaintenanceRecordRequest}とは
 * 異なり含まない。
 * Spring: UpdateMaintenanceRecordRequest
 */
export interface UpdateMaintenanceRecordRequest {
  title: string;
  maintenanceType: MaintenanceType;
  workDateFrom: string;
  workDateTo: string | null;
  mileage: number;
  remarks: string | null;
  /** 紐づく作業項目リスト（1件以上必須）。id指定で更新、id省略で新規追加 */
  workItems: WorkItemRequest[];
}

/**
 * 交換部品詳細情報（詳細・更新画面用）
 * Spring: PartResponse
 */
export interface PartDetail extends PartRequest {
  id: number;
}

/**
 * 整備作業明細詳細情報（詳細・更新画面用）
 * Spring: WorkItemResponse
 */
export interface WorkItemDetail {
  id: number;
  maintenanceCategory: MaintenanceCategory;
  workContent: string;
  performedBy: string;
  laborCost: number;
  /** 整備画像の公開URL（未設定の場合はnull） */
  imageUrl: string | null;
  parts: PartDetail[];
}

/**
 * 整備履歴詳細情報（詳細・更新画面用）
 * Spring: MaintenanceRecordResponse
 */
export interface MaintenanceRecordDetail {
  id: string;
  vehicleId: string;
  vehicleModelName: string;
  vehicleModelCode: string | null;
  title: string;
  maintenanceType: MaintenanceType;
  workDateFrom: string;
  workDateTo: string | null;
  mileage: number;
  remarks: string | null;
  /** DIYによる整備の場合はnull */
  shopName: string | null;
  workItems: WorkItemDetail[];
  /**
   * ログインユーザーがこの整備履歴を編集できるかどうか
   *
   * 車両所有者/SHOP権限ではなく、この整備履歴を登録したユーザー本人の場合のみtrue。
   */
  canEdit: boolean;
}
