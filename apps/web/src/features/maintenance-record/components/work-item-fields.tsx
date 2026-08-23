"use client";

import { useFieldArray, type Control } from "react-hook-form";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { MaintenanceImageDropzone } from "./maintenance-image-dropzone";
import { PartFields } from "./part-fields";
import { EMPTY_PART_FORM_VALUES } from "../schemas/maintenance-record.schema";
import type { MaintenanceRecordFormValues } from "../schemas/maintenance-record.schema";
import { MAINTENANCE_CATEGORY_OPTIONS } from "@/shared/constants/maintenance-category";

/**
 * Props型定義
 */
interface WorkItemFieldsProps {
  /** react-hook-formのcontrol */
  control: Control<MaintenanceRecordFormValues>;
  /** 対象作業項目のworkItems配列内インデックス */
  index: number;
  /** 読み取り専用（閲覧モード）にするかどうか */
  isReadOnly: boolean;
  /** 作業項目削除ボタンを表示するかどうか（最低1件は残す必要があるため） */
  canRemove: boolean;
  /** 作業項目削除ボタン押下時のコールバック */
  onRemove: () => void;
  /** この作業項目に選択中の画像のプレビューURL（未選択の場合はnull） */
  imagePreviewUrl: string | null;
  /** 画像選択時のコールバック */
  onImageSelect: (file: File) => void;
  /** 画像削除ボタン押下時のコールバック */
  onImageRemove: () => void;
}

/**
 * 作業項目1件分の入力フィールド群（部品リスト・整備画像を内包）
 *
 * @component
 */
export function WorkItemFields({
  control,
  index,
  isReadOnly,
  canRemove,
  onRemove,
  imagePreviewUrl,
  onImageSelect,
  onImageRemove,
}: WorkItemFieldsProps) {
  const showRequiredMark = !isReadOnly;

  // この作業項目に紐づく部品リストの動的追加・削除
  const {
    fields: partFields,
    append: appendPart,
    remove: removePart,
  } = useFieldArray({
    control,
    name: `workItems.${index}.parts`,
  });

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          作業項目 {index + 1}
        </h3>
        {!isReadOnly && canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4" />
            作業項目を削除
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        {/* 作業内容 */}
        <FormField
          control={control}
          name={`workItems.${index}.workContent`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm" required={showRequiredMark}>
                作業内容
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="例：エンジンオイル交換、フィルター交換"
                  disabled={isReadOnly}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 作業カテゴリ */}
        <FormField
          control={control}
          name={`workItems.${index}.maintenanceCategory`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm" required={showRequiredMark}>
                作業カテゴリ
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isReadOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MAINTENANCE_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 担当者名 */}
        <FormField
          control={control}
          name={`workItems.${index}.performedBy`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm" required={showRequiredMark}>
                担当者名
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="例：ガレージ田中、DIY"
                  disabled={isReadOnly}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 工賃 */}
        <FormField
          control={control}
          name={`workItems.${index}.laborCost`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm" required={showRequiredMark}>
                工賃（¥）
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  disabled={isReadOnly}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 整備画像 */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-foreground">整備画像</span>
        <MaintenanceImageDropzone
          previewUrl={imagePreviewUrl}
          onFileSelect={onImageSelect}
          onImageRemove={onImageRemove}
          disabled={isReadOnly}
        />
      </div>

      {/* 交換・追加部品 */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            交換・追加部品
          </span>
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendPart({ ...EMPTY_PART_FORM_VALUES })}
              className="gap-1.5"
            >
              <PlusIcon className="h-4 w-4" />
              部品追加
            </Button>
          )}
        </div>

        {partFields.length > 0 && (
          <div className="space-y-3">
            {partFields.map((partField, partIndex) => (
              <PartFields
                key={partField.id}
                control={control}
                workItemIndex={index}
                partIndex={partIndex}
                isReadOnly={isReadOnly}
                onRemove={() => removePart(partIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
