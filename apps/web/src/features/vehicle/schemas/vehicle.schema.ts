import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/shared/messages/validation";
import { FIELD } from "@/shared/constants/field";
import type { CreateVehicleRequest } from "../types/vehicle";

/** 年式の未来方向の許容範囲（現在の年 + この値まで） */
const MAX_MODEL_YEAR_OFFSET = 1;
/** 年式の最小許容値 */
const MIN_MODEL_YEAR = 1900;
/** 年式の最大許容値（現在の年 + オフセット） */
const MAX_MODEL_YEAR = new Date().getFullYear() + MAX_MODEL_YEAR_OFFSET;

/**
 * 車両登録・変更フォームのバリデーションスキーマ
 *
 * バックエンドの CreateVehicleRequest / @ValidModelYear と対応する制約を定義する。
 * vehicleType（現状CAR固定）と画像ファイルはこのスキーマの対象外とし、
 * 呼び出し元で別途組み立てる。
 *
 * 数値項目もHTML inputの実値に合わせてz.stringで受け、refineで数値としての妥当性を
 * 検証する（z.coerceは入力型と出力型が食い違い、useFormのResolver型と整合しなくなるため使用しない）。
 * APIリクエストへの変換は`toCreateVehicleRequest`で行う。
 */
export const vehicleSchema = z.object({
  /** 車種名のバリデーション */
  modelName: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.MODEL_NAME))
    .max(255, VALIDATION_MESSAGES.maxLength(FIELD.MODEL_NAME, 255)),

  /** メーカーのバリデーション（未選択時は空文字のため、正の値のみ許可） */
  manufacturerId: z
    .string()
    .refine(
      (value) => Number(value) > 0,
      VALIDATION_MESSAGES.required(FIELD.MANUFACTURER),
    ),

  /** 型式のバリデーション（任意項目） */
  modelCode: z
    .string()
    .max(100, VALIDATION_MESSAGES.maxLength(FIELD.MODEL_CODE, 100))
    .optional()
    .or(z.literal("")),

  /** エンジン型式のバリデーション（任意項目） */
  engineCode: z
    .string()
    .max(100, VALIDATION_MESSAGES.maxLength(FIELD.ENGINE_CODE, 100))
    .optional()
    .or(z.literal("")),

  /** 年式のバリデーション */
  modelYear: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.MODEL_YEAR))
    .refine(
      (value) => Number.isInteger(Number(value)),
      VALIDATION_MESSAGES.required(FIELD.MODEL_YEAR),
    )
    .refine(
      (value) => Number(value) >= MIN_MODEL_YEAR,
      VALIDATION_MESSAGES.minValue(FIELD.MODEL_YEAR, MIN_MODEL_YEAR),
    )
    .refine(
      (value) => Number(value) <= MAX_MODEL_YEAR,
      VALIDATION_MESSAGES.maxValue(FIELD.MODEL_YEAR, MAX_MODEL_YEAR),
    ),

  /** ナンバープレートのバリデーション（チューニングカー等を考慮し任意項目） */
  licensePlate: z
    .string()
    .max(100, VALIDATION_MESSAGES.maxLength(FIELD.LICENSE_PLATE, 100))
    .optional()
    .or(z.literal("")),

  /** 走行距離のバリデーション */
  currentMileage: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.CURRENT_MILEAGE))
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      VALIDATION_MESSAGES.minValue(FIELD.CURRENT_MILEAGE, 0),
    ),

  /** トランスミッション形式の必須チェック */
  transmissionType: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.TRANSMISSION_TYPE)),

  /** 駆動方式の必須チェック */
  driveType: z.string().min(1, VALIDATION_MESSAGES.required(FIELD.DRIVE_TYPE)),

  /** メモのバリデーション（任意項目） */
  memo: z.string().optional().or(z.literal("")),
});

/**
 * 車両登録・変更フォームの入力値の型定義
 */
export type VehicleFormValues = z.infer<typeof vehicleSchema>;

/**
 * フォーム未初期化時の空の入力値
 *
 * 登録画面の初期値、および詳細画面がデータ取得中にuseFormへ渡す暫定値として利用する。
 */
export const EMPTY_VEHICLE_FORM_VALUES: VehicleFormValues = {
  modelName: "",
  manufacturerId: "",
  modelCode: "",
  engineCode: "",
  modelYear: "",
  licensePlate: "",
  currentMileage: "",
  transmissionType: "",
  driveType: "",
  memo: "",
};

/**
 * バリデーション済みのフォーム入力値を、車両登録・更新APIリクエストへ変換する
 *
 * @param data        バリデーション済みのフォーム入力値
 * @param vehicleType 車両種別（現状はCAR固定）
 * @returns 車両登録・更新APIリクエスト
 */
export function toCreateVehicleRequest(
  data: VehicleFormValues,
  vehicleType: CreateVehicleRequest["vehicleType"],
): CreateVehicleRequest {
  return {
    ...data,
    vehicleType,
    manufacturerId: Number(data.manufacturerId),
    modelYear: Number(data.modelYear),
    currentMileage: Number(data.currentMileage),
  };
}
