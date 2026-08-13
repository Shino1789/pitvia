/**
 * 車両登録フォームの「メーカー」選択肢
 * Spring: ManufacturerOption
 */
export interface ManufacturerOption {
  id: number;
  name: string;
}

/**
 * 車両登録フォームの選択肢（value/labelペア）
 * Spring: VehicleSelectOption
 */
export interface VehicleSelectOption {
  value: string;
  label: string;
}

/**
 * 車両登録フォームの初期化に必要な選択肢一式
 * Spring: VehicleFormOptionsResponse
 */
export interface VehicleFormOptionsResponse {
  manufacturers: ManufacturerOption[];
  transmissionTypes: VehicleSelectOption[];
  driveTypes: VehicleSelectOption[];
}

/**
 * 車両登録・更新リクエスト
 * Spring: CreateVehicleRequest
 */
export interface CreateVehicleRequest {
  /** 現状はCAR固定 */
  vehicleType: "CAR";
  modelName: string;
  manufacturerId: number;
  modelCode?: string;
  engineCode?: string;
  modelYear: number;
  licensePlate?: string;
  currentMileage: number;
  transmissionType: string;
  driveType: string;
  memo?: string;
}

/**
 * 車両更新リクエスト
 *
 * 現状は登録リクエストと同一のフィールド構成のためエイリアスとしている。
 */
export type UpdateVehicleRequest = CreateVehicleRequest;

/**
 * 車両詳細情報
 * Spring: VehicleResponse
 */
export interface VehicleDetail {
  id: string;
  vehicleType: string;
  modelName: string;
  manufacturerName: string;
  modelCode: string | null;
  engineCode: string | null;
  modelYear: number;
  licensePlate: string | null;
  /** 公開URL（未設定の場合はnull） */
  imageUrl: string | null;
  currentMileage: number;
  transmissionType: string;
  driveType: string;
  memo: string | null;
}

/**
 * 車両一覧の対象オーナー情報
 *
 * ownerId指定時（SHOPが顧客の車両一覧を見る場合）のみ設定される。
 * Spring: VehicleOwnerSummary
 */
export interface VehicleOwnerSummary {
  id: string;
  userName: string;
}

/**
 * 車両一覧取得レスポンス
 * Spring: VehicleListResponse
 */
export interface VehicleListResponse {
  /** 対象オーナー情報（自分自身の一覧取得時はnull） */
  owner: VehicleOwnerSummary | null;
  vehicles: VehicleDetail[];
}
