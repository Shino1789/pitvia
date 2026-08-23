import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/shared/messages/validation";
import { FIELD } from "@/shared/constants/field";
import type { MaintenanceType } from "@/shared/constants/maintenance-type";
import type { MaintenanceCategory } from "@/shared/constants/maintenance-category";
import type {
  CreateMaintenanceRecordRequest,
  PartCondition,
} from "../types/maintenance-record";

/**
 * 交換部品1件分のバリデーションスキーマ
 * バックエンドの PartRequest と対応する制約を定義する。
 */
const partSchema = z.object({
  /** 部品の状態（任意項目、未選択時は空文字） */
  partCondition: z.string().optional().or(z.literal("")),

  /** 部品名のバリデーション */
  partName: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.PART_NAME))
    .max(255, VALIDATION_MESSAGES.maxLength(FIELD.PART_NAME, 255)),

  /** 部品メーカー名のバリデーション（任意項目） */
  manufacturerName: z
    .string()
    .max(255, VALIDATION_MESSAGES.maxLength("部品メーカー名", 255))
    .optional()
    .or(z.literal("")),

  /** 部品型番のバリデーション（任意項目） */
  partModelNumber: z
    .string()
    .max(100, VALIDATION_MESSAGES.maxLength("部品型番", 100))
    .optional()
    .or(z.literal("")),

  /** 数量のバリデーション */
  quantity: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.QUANTITY))
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      "数量は0より大きい値を入力してください",
    ),

  /** 単価のバリデーション */
  unitPrice: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.UNIT_PRICE))
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
      VALIDATION_MESSAGES.minValue(FIELD.UNIT_PRICE, 0),
    ),
});

/**
 * 作業項目1件分のバリデーションスキーマ
 * バックエンドの WorkItemRequest と対応する制約を定義する。
 */
const workItemSchema = z.object({
  /** 作業カテゴリの必須チェック */
  maintenanceCategory: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.MAINTENANCE_CATEGORY)),

  /** 作業内容のバリデーション */
  workContent: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.WORK_CONTENT))
    .max(255, VALIDATION_MESSAGES.maxLength(FIELD.WORK_CONTENT, 255)),

  /** 担当者名のバリデーション */
  performedBy: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.PERFORMED_BY))
    .max(255, VALIDATION_MESSAGES.maxLength(FIELD.PERFORMED_BY, 255)),

  /** 工賃のバリデーション */
  laborCost: z
    .string()
    .min(1, VALIDATION_MESSAGES.required(FIELD.LABOR_COST))
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
      VALIDATION_MESSAGES.minValue(FIELD.LABOR_COST, 0),
    ),

  /** 交換部品リスト（部品を伴わない作業項目もあり得るため空配列を許容） */
  parts: z.array(partSchema),
});

/**
 * 整備履歴登録・変更フォームのバリデーションスキーマ
 * バックエンドの CreateMaintenanceRecordRequest / @ValidWorkDatePeriod と対応する制約を定義する。
 */
export const maintenanceRecordSchema = z
  .object({
    /** 対象車両の必須チェック */
    vehicleId: z.string().min(1, VALIDATION_MESSAGES.required(FIELD.VEHICLE)),

    /** タイトルのバリデーション */
    title: z
      .string()
      .min(1, VALIDATION_MESSAGES.required(FIELD.TITLE))
      .max(255, VALIDATION_MESSAGES.maxLength(FIELD.TITLE, 255)),

    /** 整備種別の必須チェック */
    maintenanceType: z
      .string()
      .min(1, VALIDATION_MESSAGES.required(FIELD.MAINTENANCE_TYPE)),

    /** 作業開始日の必須チェック */
    workDateFrom: z
      .string()
      .min(1, VALIDATION_MESSAGES.required(FIELD.WORK_DATE_FROM)),

    /** 作業終了日のバリデーション（任意項目） */
    workDateTo: z.string().optional().or(z.literal("")),

    /** 走行距離のバリデーション */
    mileage: z
      .string()
      .min(1, VALIDATION_MESSAGES.required(FIELD.MILEAGE))
      .refine(
        (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
        VALIDATION_MESSAGES.minValue(FIELD.MILEAGE, 0),
      ),

    /** 備考のバリデーション（任意項目） */
    remarks: z.string().optional().or(z.literal("")),

    /** 作業項目リスト（1件以上必須） */
    workItems: z
      .array(workItemSchema)
      .min(1, "作業項目を1件以上追加してください"),
  })
  /** 作業終了日は作業開始日以降であることのチェック */
  .refine((data) => !data.workDateTo || data.workDateTo >= data.workDateFrom, {
    message: "作業終了日は作業開始日以降の日付を入力してください",
    path: ["workDateTo"],
  });

/**
 * 整備履歴登録・変更フォームの入力値の型定義
 */
export type MaintenanceRecordFormValues = z.infer<
  typeof maintenanceRecordSchema
>;

/** 部品1件分の空の入力値 */
export const EMPTY_PART_FORM_VALUES: MaintenanceRecordFormValues["workItems"][number]["parts"][number] =
  {
    partCondition: "",
    partName: "",
    manufacturerName: "",
    partModelNumber: "",
    quantity: "",
    unitPrice: "",
  };

/** 作業項目1件分の空の入力値 */
export const EMPTY_WORK_ITEM_FORM_VALUES: MaintenanceRecordFormValues["workItems"][number] =
  {
    maintenanceCategory: "",
    workContent: "",
    performedBy: "",
    laborCost: "",
    parts: [],
  };

/**
 * フォーム未初期化時の空の入力値
 *
 * 登録画面の初期値として利用する。作業項目は画面モックに合わせ、最初から1件表示された状態にする。
 */
export const EMPTY_MAINTENANCE_RECORD_FORM_VALUES: MaintenanceRecordFormValues =
  {
    vehicleId: "",
    title: "",
    maintenanceType: "",
    workDateFrom: "",
    workDateTo: "",
    mileage: "",
    remarks: "",
    workItems: [EMPTY_WORK_ITEM_FORM_VALUES],
  };

/**
 * バリデーション済みのフォーム入力値を、整備履歴登録APIリクエストへ変換する
 *
 * @param data バリデーション済みのフォーム入力値
 * @returns 整備履歴登録APIリクエスト
 */
export function toCreateMaintenanceRecordRequest(
  data: MaintenanceRecordFormValues,
): CreateMaintenanceRecordRequest {
  return {
    vehicleId: data.vehicleId,
    title: data.title,
    maintenanceType: data.maintenanceType as MaintenanceType,
    workDateFrom: data.workDateFrom,
    workDateTo: data.workDateTo ? data.workDateTo : null,
    mileage: Number(data.mileage),
    remarks: data.remarks ? data.remarks : null,
    workItems: data.workItems.map((item) => ({
      maintenanceCategory: item.maintenanceCategory as MaintenanceCategory,
      workContent: item.workContent,
      performedBy: item.performedBy,
      laborCost: Number(item.laborCost),
      parts: item.parts.map((part) => ({
        partCondition: part.partCondition
          ? (part.partCondition as PartCondition)
          : null,
        partName: part.partName,
        manufacturerName: part.manufacturerName ? part.manufacturerName : null,
        partModelNumber: part.partModelNumber ? part.partModelNumber : null,
        quantity: Number(part.quantity),
        unitPrice: Number(part.unitPrice),
      })),
    })),
  };
}

/**
 * フォームの現在値から、合計金額（工賃合計＋部品代合計）を算出する
 *
 * @param workItems フォームの作業項目リスト（`useWatch({ name: "workItems" })`の値）
 * @returns 合計金額
 */
export function calculateTotalCost(
  workItems: MaintenanceRecordFormValues["workItems"],
): number {
  return workItems.reduce((workItemSum, item) => {
    const laborCost = Number(item.laborCost) || 0;
    const partsCost = item.parts.reduce((partSum, part) => {
      const quantity = Number(part.quantity) || 0;
      const unitPrice = Number(part.unitPrice) || 0;
      return partSum + quantity * unitPrice;
    }, 0);
    return workItemSum + laborCost + partsCost;
  }, 0);
}
