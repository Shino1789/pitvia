"use client";

import type { Control } from "react-hook-form";
import { Trash2Icon } from "lucide-react";
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
import { PART_CONDITION_LABELS } from "../types/maintenance-record";
import type { MaintenanceRecordFormValues } from "../schemas/maintenance-record.schema";

/**
 * Props型定義
 */
interface PartFieldsProps {
  /** react-hook-formのcontrol */
  control: Control<MaintenanceRecordFormValues>;
  /** 対象作業項目のworkItems配列内インデックス */
  workItemIndex: number;
  /** 対象部品のparts配列内インデックス */
  partIndex: number;
  /** 読み取り専用（閲覧モード）にするかどうか */
  isReadOnly: boolean;
  /** 削除ボタン押下時のコールバック */
  onRemove: () => void;
}

/**
 * 交換部品1件分の入力フィールド群
 *
 * @component
 */
export function PartFields({
  control,
  workItemIndex,
  partIndex,
  isReadOnly,
  onRemove,
}: PartFieldsProps) {
  const namePrefix = `workItems.${workItemIndex}.parts.${partIndex}` as const;
  const showRequiredMark = !isReadOnly;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 grid-cols-1 items-start gap-3 sm:grid-cols-2">
          {/* 部品名 */}
          <FormField
            control={control}
            name={`${namePrefix}.partName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs" required={showRequiredMark}>
                  部品名
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="例：ブレーキパッド"
                    disabled={isReadOnly}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 部品状態 */}
          <FormField
            control={control}
            name={`${namePrefix}.partCondition`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">部品状態</FormLabel>
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
                    {Object.entries(PART_CONDITION_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 部品メーカー */}
          <FormField
            control={control}
            name={`${namePrefix}.manufacturerName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">部品メーカー</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例：プロジェクトミュー"
                    disabled={isReadOnly}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 部品型番 */}
          <FormField
            control={control}
            name={`${namePrefix}.partModelNumber`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">部品型番</FormLabel>
                <FormControl>
                  <Input placeholder="例：F328" disabled={isReadOnly} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 数量 */}
          <FormField
            control={control}
            name={`${namePrefix}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs" required={showRequiredMark}>
                  数量
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

          {/* 単価 */}
          <FormField
            control={control}
            name={`${namePrefix}.unitPrice`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs" required={showRequiredMark}>
                  単価（¥）
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

        {/* 部品削除ボタン */}
        {!isReadOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label="この部品を削除"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
