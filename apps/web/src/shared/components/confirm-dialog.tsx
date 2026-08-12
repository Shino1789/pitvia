"use client";

import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props型定義
 */
interface ConfirmDialogProps {
  /** ダイアログの表示状態 */
  open: boolean;
  /** 表示状態が変化した際のコールバック（背景クリック・Escでの操作を含む） */
  onOpenChange: (open: boolean) => void;
  /** ダイアログタイトル */
  title: string;
  /** タイトル下に表示する補足説明 */
  description?: string;
  /** 確定ボタンのラベル */
  confirmLabel?: string;
  /** キャンセルボタンのラベル */
  cancelLabel?: string;
  /**
   * 確定ボタンの色味
   * - destructive: 削除・破棄など取り消せない操作の確認（赤色）
   * - default: それ以外の重要な確認（通常色）
   *
   * アイコンは危険度に関わらず常に警告色（黄色系）で統一しており、この設定の対象外。
   */
  variant?: "destructive" | "default";
  /** 確定ボタン押下時のコールバック */
  onConfirm: () => void;
}

/**
 * ユーザーの不可逆・重要な操作を確認するための共通ダイアログ
 *
 * 「削除」専用ではなく、編集内容の破棄確認など、確認を挟みたい操作全般で再利用する
 * 想定のため、コンポーネント名・Propsとも特定の操作に依存しない汎用的な形にしている。
 *
 * @component
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "実行する",
  cancelLabel = "キャンセル",
  variant = "destructive",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {/* 警告アイコン（危険度に関わらず、注意喚起として常に黄色系で統一） */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" }),
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
