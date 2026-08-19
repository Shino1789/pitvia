"use client";

import { useRef, useState } from "react";
import { CameraIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** 選択可能な画像ファイルのMIMEタイプ（バックエンドのMaintenanceImageValidationPolicyと一致させる） */
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

/**
 * Props型定義
 */
interface MaintenanceImageDropzoneProps {
  /** プレビュー表示するURL（選択中ファイルのオブジェクトURL、または既存の整備画像URL） */
  previewUrl: string | null;
  /** ファイル選択時のコールバック */
  onFileSelect: (file: File) => void;
  /** 画像削除ボタン押下時のコールバック（未指定の場合は削除ボタン自体を表示しない） */
  onImageRemove?: () => void;
  /** 読み取り専用（閲覧モード）にするかどうか */
  disabled?: boolean;
}

/**
 * 整備作業項目の画像アップロード用ドラッグ&ドロップゾーン（1作業項目につき1枚）
 *
 * {@link VehicleImageDropzone}と同じ実装方式を、作業項目内に収まる横長のレイアウトに調整したもの。
 *
 * @component
 */
export function MaintenanceImageDropzone({
  previewUrl,
  onFileSelect,
  onImageRemove,
  disabled = false,
}: MaintenanceImageDropzoneProps) {
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
        // vehicle-image-dropzone.tsxと同じpink系デザイントークンを踏襲しつつ、
        // 作業項目内に収まる横長レイアウトにする
        "relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-pink-500/40 bg-pink-500/5 transition-colors",
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
            alt="整備画像プレビュー"
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
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-pink-400/80">
          <CameraIcon className="h-6 w-6" />
          {!disabled && (
            <p className="text-xs">クリックまたはドラッグ&ドロップで画像を追加</p>
          )}
        </div>
      )}
    </div>
  );
}
