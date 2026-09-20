import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/shared/messages/validation";
import { FIELD } from "@/shared/constants/field";

/**
 * ショップ連携（招待コード入力）フォームのバリデーションスキーマ
 *
 * バックエンドの ShopLinkRequest（vehicleId: @NotNull / inviteCode: @NotBlank）と対応する
 * 制約を定義する。招待コードの有効性（存在・期限・失効）はバックエンドで判定するため、
 * フロントエンドでは形式チェックを行わず必須入力のみを検証する。
 */
export const shopLinkSchema = z.object({
  /** 対象車両の必須チェック（未選択時は空文字） */
  vehicleId: z.string().min(1, VALIDATION_MESSAGES.required(FIELD.VEHICLE)),

  /** 招待コードの必須チェック（前後の空白は除去する。空白のみは未入力扱い） */
  inviteCode: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.required(FIELD.INVITE_CODE)),
});

/**
 * ショップ連携フォームの入力値の型定義
 */
export type ShopLinkFormValues = z.infer<typeof shopLinkSchema>;

/**
 * フォーム初期表示時の空の入力値
 */
export const EMPTY_SHOP_LINK_FORM_VALUES: ShopLinkFormValues = {
  vehicleId: "",
  inviteCode: "",
};
