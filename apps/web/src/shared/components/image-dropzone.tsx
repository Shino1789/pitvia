"use client";

import { useRef, useState, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** 選択可能な画像ファイルのMIMEタイプ（バックエンドのImageValidationPolicy実装と一致させる） */
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

/**
 * Props型定義
 */
interface ImageDropzoneProps {
  /** プレビュー表示するURL（選択中ファイルのオブジェクトURL、または既存の画像URL） */
  previewUrl: string | null;
  /** プレビュー画像のalt属性 */
  previewAlt: string;
  /** ファイル選択時のコールバック */
  onFileSelect: (file: File) => void;
  /** 画像削除ボタン押下時のコールバック（未指定の場合は削除ボタン自体を表示しない）*/
  onImageRemove?: () => void;
  /** 読み取り専用（閲覧モード）にするかどうか */
  disabled?: boolean;
  /** 枠・プレースホルダーに適用するコンテナのクラス名（サイズ・アスペクト比等、用途ごとに異なる部分） */
  containerClassName: string;
  /** 未選択時に表示するプレースホルダーの内容（用途ごとに異なるアイコン・文言） */
  emptyState: ReactNode;
}

/**
 * 画像アップロード用のドラッグ&ドロップゾーン（クリック選択・ドラッグ&ドロップ・削除に共通の挙動）
 *
 * {@link VehicleImageDropzone}・{@link MaintenanceImageDropzone}が、枠のサイズと
 * プレースホルダー表示のみを差し替えて利用する共通実装。
 *
 * @component
 */
export function ImageDropzone({
  previewUrl,
  previewAlt,
  onFileSelect,
  onImageRemove,
  disabled = false,
  containerClassName,
  emptyState,
}: ImageDropzoneProps) {
  // 非表示のfile inputへの参照（クリックでのファイル選択用）
  const inputRef = useRef<HTMLInputElement>(null);
  // ドラッグ中の枠線ハイライト表示を制御するstate
  const [isDragOver, setIsDragOver] = useState(false);

  /**
   * 選択・ドロップされたファイルリストから先頭の1件を取り出し、親へ通知する
   *
   * @param files FileList
   */
  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        // 画面モックに合わせ、未選択時の枠はTailwind標準のpinkパレットで表現する
        // （アプリの共通デザイントークンにピンク系の色が存在しないため、独自の色コードを
        // ハードコードせずTailwindの標準カラーパレットの範囲内で対応している）
        "relative overflow-hidden rounded-lg border-2 border-dashed border-pink-500/40 bg-pink-500/5 transition-colors",
        containerClassName,
        !disabled &&
          "cursor-pointer hover:border-pink-400/70 hover:bg-pink-500/10",
        isDragOver && "border-pink-400 bg-pink-500/10",
        disabled && "opacity-80",
      )}
    >
      {/* 非表示のネイティブファイル入力（クリック選択用） */}
      {!disabled && (
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      )}

      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- MinIO/S3の公開URLおよびローカルのオブジェクトURLを直接表示するため next/image は使用しない */}
          <img
            src={previewUrl}
            alt={previewAlt}
            className="h-full w-full object-cover"
          />
          {!disabled && onImageRemove && (
            <button
              type="button"
              aria-label="画像を削除"
              onClick={(e) => {
                // 親要素（role="button"）のクリックへ伝播すると、ファイル選択ダイアログが意図せず開いてしまうため止める
                e.stopPropagation();
                onImageRemove();
              }}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      ) : (
        emptyState
      )}
    </div>
  );
}
