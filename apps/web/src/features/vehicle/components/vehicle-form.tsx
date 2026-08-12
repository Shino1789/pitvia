"use client";

import type { UseFormReturn } from "react-hook-form";
import { Trash2Icon, SaveIcon } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { SegmentedToggle } from "@/shared/ui/segmented-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { VehicleImageDropzone } from "./vehicle-image-dropzone";
import type {
  VehicleFormOptionsResponse,
  VehicleSelectOption,
} from "../types/vehicle";
import type { VehicleFormValues } from "../schemas/vehicle.schema";

/**
 * Props型定義
 */
interface VehicleFormProps {
  /** react-hook-formのフォームインスタンス（呼び出し元で生成し渡す） */
  form: UseFormReturn<VehicleFormValues>;
  /** 表示モード（create: 新規登録, view: 閲覧, edit: 編集） */
  mode: "create" | "view" | "edit";
  /** フォームの選択肢一式 */
  formOptions: VehicleFormOptionsResponse;
  /** 画像のプレビューURL（選択中ファイルのオブジェクトURL、または既存の車両画像URL） */
  imagePreviewUrl: string | null;
  /** 画像選択時のコールバック */
  onImageSelect: (file: File) => void;
  /** フォーム送信時のコールバック（バリデーション済みの値が渡される） */
  onSubmit: (data: VehicleFormValues) => void;
  /** 削除ボタン押下時のコールバック（未指定の場合は削除ボタン自体を表示しない） */
  onDelete?: () => void;
  /** 送信中かどうか */
  isSubmitting?: boolean;
  /** 登録・更新API失敗時のエラーメッセージ（フォーム上部にインライン表示する） */
  apiError?: string | null;
}

/**
 * 車両登録画面・詳細画面で共有するフォーム本体
 *
 * `mode`に応じて、同じフィールド構成を「編集可能な入力欄」または「読み取り専用の表示」として出し分ける。
 *
 * @component
 */
export function VehicleForm({
  form,
  mode,
  formOptions,
  imagePreviewUrl,
  onImageSelect,
  onSubmit,
  onDelete,
  isSubmitting = false,
  apiError,
}: VehicleFormProps) {
  const isReadOnly = mode === "view";
  // 閲覧モードでは編集できないため、必須マーク（*）は編集可能な場合のみ表示する
  const showRequiredMark = !isReadOnly;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* APIエラーが発生した際のエラーメッセージ表示（register-form.tsx等と同一パターン） */}
        {/* 閲覧モードは送信操作自体が無いため対象外とする */}
        {!isReadOnly && apiError && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[14rem_1fr]">
          {/* 車両画像 */}
          <VehicleImageDropzone
            previewUrl={imagePreviewUrl}
            onFileSelect={onImageSelect}
            disabled={isReadOnly}
          />

          {/* 基本情報 */}
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            {/* メーカー */}
            <FormField
              control={form.control}
              name="manufacturerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    メーカー
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue
                      value={
                        formOptions.manufacturers.find(
                          (m) => String(m.id) === field.value,
                        )?.name
                      }
                    />
                  ) : (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.manufacturers.map((manufacturer) => (
                          <SelectItem
                            key={manufacturer.id}
                            value={String(manufacturer.id)}
                          >
                            {manufacturer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 車名 */}
            <FormField
              control={form.control}
              name="modelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    車名
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input placeholder="RX-7" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 型式 */}
            <FormField
              control={form.control}
              name="modelCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">型式</FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input placeholder="FD3S" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 年式 */}
            <FormField
              control={form.control}
              name="modelYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    年式
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input type="number" inputMode="numeric" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ナンバープレート */}
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">ナンバープレート</FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input placeholder="品川 300 な 77-77" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 走行距離 */}
            <FormField
              control={form.control}
              name="currentMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    走行距離（km）
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue
                      value={
                        field.value ? Number(field.value).toLocaleString() : ""
                      }
                    />
                  ) : (
                    <FormControl>
                      <Input type="number" inputMode="numeric" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 車両スペック */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              車両スペック
            </h2>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
            {/* トランスミッション */}
            <FormField
              control={form.control}
              name="transmissionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    トランスミッション
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue
                      value={toLabel(
                        formOptions.transmissionTypes,
                        field.value,
                      )}
                    />
                  ) : (
                    <SegmentedToggle
                      options={formOptions.transmissionTypes}
                      value={field.value}
                      onChange={field.onChange}
                      ariaLabel="トランスミッション"
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 駆動方式 */}
            <FormField
              control={form.control}
              name="driveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    駆動方式
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue
                      value={toLabel(formOptions.driveTypes, field.value)}
                    />
                  ) : (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formOptions.driveTypes.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* エンジン型式 */}
            <FormField
              control={form.control}
              name="engineCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">エンジン型式</FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input placeholder="13B-REW" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* メモ */}
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">メモ</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} multiline />
              ) : (
                <FormControl>
                  <Textarea
                    placeholder="カスタムパーツや整備履歴の概要など..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 送信・削除ボタン */}
        {!isReadOnly && (
          <div className="flex justify-end gap-2">
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Trash2Icon className="h-4 w-4" />
                削除
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <SaveIcon className="h-4 w-4" />
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

/**
 * 選択肢一覧からvalueに対応するlabelを取得する（未検出時はvalueをそのまま返す）
 *
 * @param options 選択肢一覧
 * @param value   検索対象の値
 * @returns 表示ラベル
 */
function toLabel(
  options: VehicleSelectOption[],
  value: string | undefined,
): string | undefined {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * 閲覧モード用の読み取り専用テキスト表示
 */
function ReadOnlyValue({
  value,
  multiline = false,
}: {
  value: string | number | undefined | null;
  multiline?: boolean;
}) {
  return (
    <p
      className={
        multiline
          ? "min-h-24 py-2 text-sm whitespace-pre-line text-foreground"
          : "py-2 text-sm text-foreground"
      }
    >
      {value || value === 0 ? value : "-"}
    </p>
  );
}
