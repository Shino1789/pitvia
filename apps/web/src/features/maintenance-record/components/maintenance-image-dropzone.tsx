"use client";

import { CameraIcon } from "lucide-react";
import { ImageDropzone } from "@/shared/components/image-dropzone";

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
 * 共通実装（{@link ImageDropzone}）を、作業項目内に収まる横長レイアウトのプレースホルダー表示で利用する。
 *
 * @component
 */
export function MaintenanceImageDropzone({
  previewUrl,
  onFileSelect,
  onImageRemove,
  disabled = false,
}: MaintenanceImageDropzoneProps) {
  return (
    <ImageDropzone
      previewUrl={previewUrl}
      previewAlt="整備画像プレビュー"
      onFileSelect={onFileSelect}
      onImageRemove={onImageRemove}
      disabled={disabled}
      containerClassName="h-32 w-full"
      emptyState={
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-pink-400/80">
          <CameraIcon className="h-6 w-6" />
          {!disabled && (
            <p className="text-xs">クリックまたはドラッグ&ドロップで画像を追加</p>
          )}
        </div>
      }
    />
  );
}
