"use client";

import { CameraIcon } from "lucide-react";
import { ImageDropzone } from "@/shared/components/image-dropzone";

/**
 * Props型定義
 */
interface VehicleImageDropzoneProps {
  /** プレビュー表示するURL（選択中ファイルのオブジェクトURL、または既存の車両画像URL） */
  previewUrl: string | null;
  /** ファイル選択時のコールバック */
  onFileSelect: (file: File) => void;
  /** 画像削除ボタン押下時のコールバック（未指定の場合は削除ボタン自体を表示しない）*/
  onImageRemove?: () => void;
  /** 読み取り専用（閲覧モード）にするかどうか */
  disabled?: boolean;
}

/**
 * 車両画像アップロード用のドラッグ&ドロップゾーン
 *
 * 共通実装（{@link ImageDropzone}）を、正方形レイアウトのプレースホルダー表示で利用する。
 *
 * @component
 */
export function VehicleImageDropzone({
  previewUrl,
  onFileSelect,
  onImageRemove,
  disabled = false,
}: VehicleImageDropzoneProps) {
  return (
    <ImageDropzone
      previewUrl={previewUrl}
      previewAlt="車両画像プレビュー"
      onFileSelect={onFileSelect}
      onImageRemove={onImageRemove}
      disabled={disabled}
      containerClassName="aspect-square w-full max-w-56"
      emptyState={
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-pink-400/80">
          <CameraIcon className="h-8 w-8" />
          {!disabled && (
            <div className="text-center">
              <p className="text-xs font-semibold tracking-wide">
                UPLOAD PHOTO
              </p>
              <p className="text-xs">Drag &amp; drop image files</p>
            </div>
          )}
        </div>
      }
    />
  );
}
