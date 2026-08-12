"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ErrorState } from "@/shared/components/state/error-state";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { VehicleForm } from "./vehicle-form";
import { VehicleFormSkeleton } from "./vehicle-form-skeleton";
import { useVehicleFormOptions } from "../hooks/use-vehicle-form-options";
import { useRegisterVehicle } from "../hooks/use-register-vehicle";
import {
  vehicleSchema,
  toCreateVehicleRequest,
  EMPTY_VEHICLE_FORM_VALUES,
  type VehicleFormValues,
} from "../schemas/vehicle.schema";
import { useHeader } from "@/shared/hooks/use-header";
import { useDiscardGuard } from "@/shared/hooks/use-discard-guard";

/** 現状はCAR固定 */
const VEHICLE_TYPE = "CAR" as const;

/**
 * 車両登録画面表示用メインコンテンツコンポーネント
 *
 * @component
 * @returns 車両登録コンテンツのJSX要素
 */
export function VehicleRegisterContent() {
  // Next.jsのルーターを取得
  const router = useRouter();
  // フォーム選択肢取得カスタムフックから状態を取得
  const {
    data: formOptions,
    isPending,
    isError,
    refetch,
  } = useVehicleFormOptions(VEHICLE_TYPE);
  // 車両登録処理カスタムフックから状態と関数を取得
  const { registerVehicle, isLoading, error: apiError } = useRegisterVehicle();
  // 未保存の変更を破棄する前の確認ダイアログ制御
  const { isOpen, guard, confirm, cancel } = useDiscardGuard();

  // 選択中の画像ファイルを管理するstate
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 動的ヘッダーにタイトルを登録
  useHeader({ title: "車両登録" });

  // フォームバリデーションスキーマの初期化
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: EMPTY_VEHICLE_FORM_VALUES,
  });

  // formState はレンダリング中に参照して初めて内部の購読が有効化され、値が更新されるようになる
  // （react-hook-formの仕様）。ハンドラー内でのみ参照すると常にfalseのまま変化しないため、
  // ここで明示的に読み出しておく。
  const { isDirty } = form.formState;

  // 選択中の画像ファイルからプレビュー用のオブジェクトURLを生成する
  const imagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  // 生成したオブジェクトURLをアンマウント・変更時に解放する
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // データ取得中はスケルトンUIを表示
  if (isPending) {
    return <VehicleFormSkeleton />;
  }

  // データの取得に失敗した場合
  if (isError || !formOptions) {
    return <ErrorState onRetry={refetch} />;
  }

  /**
   * キャンセルボタン押下時のハンドラー
   *
   * 未保存の入力がある場合のみ確認ダイアログを挟んでから遷移する。
   */
  const handleCancel = () => {
    guard(isDirty, () => router.back());
  };

  /**
   * フォーム送信時のハンドラー
   *
   * @param data バリデーション済みのフォーム入力値
   */
  const handleSubmit = (data: VehicleFormValues) => {
    registerVehicle(toCreateVehicleRequest(data, VEHICLE_TYPE), imageFile);
  };

  return (
    <div className="space-y-4">
      {/* 一覧へ戻るボタン */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        キャンセル
      </Button>

      <Card className="bg-card border-border">
        <CardContent>
          <VehicleForm
            form={form}
            mode="create"
            formOptions={formOptions}
            imagePreviewUrl={imagePreviewUrl}
            onImageSelect={setImageFile}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
            apiError={apiError}
          />
        </CardContent>
      </Card>

      {/* 未保存の入力破棄確認ダイアログ */}
      <ConfirmDialog
        open={isOpen}
        onOpenChange={cancel}
        title="入力内容を破棄しますか？"
        description="保存されていない変更は失われます。"
        confirmLabel="破棄する"
        variant="destructive"
        onConfirm={confirm}
      />
    </div>
  );
}
