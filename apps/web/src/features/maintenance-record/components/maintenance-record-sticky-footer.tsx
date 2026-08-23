"use client";

import { SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatYenFull } from "@/shared/utils/format";

/**
 * Props型定義
 */
interface MaintenanceRecordStickyFooterProps {
  /** 表示モード（create: 新規登録, view: 閲覧, edit: 編集） */
  mode: "create" | "view" | "edit";
  /** 現在の合計金額 */
  totalCost: number;
  /** キャンセルボタン押下時のコールバック */
  onCancel: () => void;
  /** 削除ボタン押下時のコールバック（編集モードのみ表示） */
  onDelete?: () => void;
  /** 送信中かどうか */
  isSubmitting?: boolean;
}

/**
 * 整備履歴登録・詳細/更新画面で共有する、画面下部に常に固定表示されるフッター
 *
 * 左側に合計金額、右側にモードに応じたアクションボタンを表示する。
 *
 * - 登録画面（create）：キャンセル・保存
 * - 詳細/閲覧（view）：キャンセルのみ
 * - 詳細/編集（edit）：削除・保存
 *
 * @component
 */
export function MaintenanceRecordStickyFooter({
  mode,
  totalCost,
  onCancel,
  onDelete,
  isSubmitting = false,
}: MaintenanceRecordStickyFooterProps) {
  const isReadOnly = mode === "view";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* 左側：合計金額 */}
        <div>
          <p className="text-xs text-muted-foreground">合計金額</p>
          <p className="text-lg font-semibold text-foreground">
            {formatYenFull(totalCost)}
          </p>
        </div>

        {/* 右側：モード別アクションボタン */}
        <div className="flex items-center gap-2">
          {isReadOnly ? (
            <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
              <XIcon className="h-4 w-4" />
              キャンセル
            </Button>
          ) : (
            <>
              {mode === "create" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <XIcon className="h-4 w-4" />
                  キャンセル
                </Button>
              )}
              {mode === "edit" && onDelete && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
