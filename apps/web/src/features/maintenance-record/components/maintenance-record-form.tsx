"use client";

import type { UseFormReturn } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
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
import { WorkItemFields } from "./work-item-fields";
import { MaintenanceRecordStickyFooter } from "./maintenance-record-sticky-footer";
import {
  calculateTotalCost,
  type MaintenanceRecordFormValues,
} from "../schemas/maintenance-record.schema";
import { MAINTENANCE_TYPE_LABELS } from "@/shared/constants/maintenance-type";

/** react-hook-formのuseFieldArrayが返すworkItemsのフィールド情報（idのみ利用） */
interface WorkItemField {
  id: string;
}

/**
 * Props型定義
 */
interface MaintenanceRecordFormProps {
  /** react-hook-formのフォームインスタンス（呼び出し元で生成し渡す） */
  form: UseFormReturn<MaintenanceRecordFormValues>;
  /** 表示モード（create: 新規登録, view: 閲覧, edit: 編集） */
  mode: "create" | "view" | "edit";
  /** 対象車両の選択肢（登録画面でのみ使用。詳細/更新画面では車両は変更不可のため読み取り専用表示） */
  vehicleOptions: { value: string; label: string }[];
  /** 対象車両の表示名（詳細/更新画面用。登録画面では未使用） */
  vehicleLabel?: string;
  /** react-hook-form useFieldArray（workItems）から取得したフィールド情報 */
  workItemFields: WorkItemField[];
  /** 「＋作業項目を追加」押下時のコールバック */
  onAddWorkItem: () => void;
  /** 作業項目削除ボタン押下時のコールバック */
  onRemoveWorkItem: (index: number) => void;
  /** 作業項目の画像プレビューURLを取得する関数（未選択の場合はnullを返す） */
  getWorkItemImagePreviewUrl: (fieldId: string) => string | null;
  /** 作業項目の画像選択時のコールバック */
  onWorkItemImageSelect: (fieldId: string, file: File) => void;
  /** 作業項目の画像削除ボタン押下時のコールバック */
  onWorkItemImageRemove: (fieldId: string) => void;
  /** フォーム送信時のコールバック（バリデーション済みの値が渡される） */
  onSubmit: (data: MaintenanceRecordFormValues) => void;
  /** キャンセルボタン押下時のコールバック */
  onCancel: () => void;
  /** 削除ボタン押下時のコールバック（編集モードのみ表示） */
  onDelete?: () => void;
  /** 送信中かどうか */
  isSubmitting?: boolean;
  /** 登録・更新API失敗時のエラーメッセージ（フォーム上部にインライン表示する） */
  apiError?: string | null;
}

/**
 * 整備履歴登録画面・詳細/更新画面で共有するフォームコンポーネント
 *
 * @component
 */
export function MaintenanceRecordForm({
  form,
  mode,
  vehicleOptions,
  vehicleLabel,
  workItemFields,
  onAddWorkItem,
  onRemoveWorkItem,
  getWorkItemImagePreviewUrl,
  onWorkItemImageSelect,
  onWorkItemImageRemove,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  apiError,
}: MaintenanceRecordFormProps) {
  const isReadOnly = mode === "view";
  const showRequiredMark = !isReadOnly;

  // 合計金額はフォームの現在値（工賃＋部品代）から都度算出する
  const totalCost = calculateTotalCost(form.watch("workItems"));

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 pb-24"
        noValidate
      >
        {/* APIエラーが発生した際のエラーメッセージ表示（vehicle-form.tsxと同一パターン） */}
        {!isReadOnly && apiError && (
          <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
            {apiError}
          </div>
        )}

        {/* 基本情報 */}
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold text-foreground">基本情報</h2>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            {/* タイトル */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    タイトル
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input
                        placeholder="例：車検対応、オイル交換"
                        {...field}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 整備種別 */}
            <FormField
              control={form.control}
              name="maintenanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    整備種別
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue
                      value={
                        MAINTENANCE_TYPE_LABELS[
                          field.value as keyof typeof MAINTENANCE_TYPE_LABELS
                        ]
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
                        {Object.entries(MAINTENANCE_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 対象車両 */}
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    対象車両
                  </FormLabel>
                  {mode === "create" ? (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    // 詳細/更新画面では車両の変更を対象外とし、常に読み取り専用表示にする
                    <ReadOnlyValue value={vehicleLabel} />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 整備完了時の走行距離 */}
            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    整備完了時の走行距離 (km)
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue
                      value={
                        field.value ? Number(field.value).toLocaleString() : ""
                      }
                    />
                  ) : (
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="例：85000"
                        {...field}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 作業開始日 */}
            <FormField
              control={form.control}
              name="workDateFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm" required={showRequiredMark}>
                    作業開始日
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 作業終了日 */}
            <FormField
              control={form.control}
              name="workDateTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">作業終了日</FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 作業項目 */}
        <div className="space-y-4">
          {workItemFields.map((field, index) => (
            <WorkItemFields
              key={field.id}
              control={form.control}
              index={index}
              isReadOnly={isReadOnly}
              canRemove={workItemFields.length > 1}
              onRemove={() => onRemoveWorkItem(index)}
              imagePreviewUrl={getWorkItemImagePreviewUrl(field.id)}
              onImageSelect={(file) => onWorkItemImageSelect(field.id, file)}
              onImageRemove={() => onWorkItemImageRemove(field.id)}
            />
          ))}

          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={onAddWorkItem}
              className="w-full gap-1.5 border-dashed"
            >
              <PlusIcon className="h-4 w-4" />
              作業項目を追加
            </Button>
          )}
        </div>

        {/* 備考 */}
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">備考</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} multiline />
              ) : (
                <FormControl>
                  <Textarea
                    placeholder="その他の特記事項があれば記入してください"
                    rows={4}
                    {...field}
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 常に画面下部に固定表示されるフッター（合計金額・操作ボタン） */}
        <MaintenanceRecordStickyFooter
          mode={mode}
          totalCost={totalCost}
          onCancel={onCancel}
          onDelete={onDelete}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
}

/**
 * 閲覧モード用の読み取り専用テキスト表示（vehicle-form.tsxと同一パターン）
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
