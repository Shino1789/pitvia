"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  SegmentedToggle,
  type SegmentedToggleOption,
} from "@/shared/ui/segmented-toggle";
import { ErrorState } from "@/shared/components/state/error-state";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { VehicleForm } from "./vehicle-form";
import { VehicleFormSkeleton } from "./vehicle-form-skeleton";
import { useVehicleDetail } from "../hooks/use-vehicle-detail";
import { useVehicleFormOptions } from "../hooks/use-vehicle-form-options";
import { useUpdateVehicle } from "../hooks/use-update-vehicle";
import { useDeleteVehicle } from "../hooks/use-delete-vehicle";
import {
  vehicleSchema,
  toCreateVehicleRequest,
  EMPTY_VEHICLE_FORM_VALUES,
  type VehicleFormValues,
} from "../schemas/vehicle.schema";
import { useHeader } from "@/shared/hooks/use-header";
import { useDiscardGuard } from "@/shared/hooks/use-discard-guard";
import { vehicleListRoute } from "@/shared/constants/routes";

/** 現状はCAR固定 */
const VEHICLE_TYPE = "CAR" as const;

/** 閲覧モード/編集モードの切り替え選択肢 */
const MODE_OPTIONS: SegmentedToggleOption<"view" | "edit">[] = [
  { value: "view", label: "閲覧モード" },
  { value: "edit", label: "編集モード" },
];

/**
 * 車両詳細・更新画面表示用メインコンテンツコンポーネント
 *
 * @component
 * @returns 車両詳細コンテンツのJSX要素
 */
export function VehicleDetailContent() {
  // 動的ルートパラメータから車両IDを取得
  const { vehicleId } = useParams<{ vehicleId: string }>();
  // Next.jsのルーターを取得
  const router = useRouter();
  // 遷移元の対象オーナーID（SHOPが特定顧客の車両一覧から遷移してきた場合のみ付与される）
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("ownerId") ?? undefined;

  // 車両詳細取得カスタムフックから状態を取得
  const {
    data: vehicle,
    isPending: isVehiclePending,
    isError: isVehicleError,
    refetch: refetchVehicle,
  } = useVehicleDetail(vehicleId);
  // フォーム選択肢取得カスタムフックから状態を取得
  const {
    data: formOptions,
    isPending: isOptionsPending,
    isError: isOptionsError,
    refetch: refetchOptions,
  } = useVehicleFormOptions(VEHICLE_TYPE);
  // 車両更新・削除処理カスタムフックから状態と関数を取得
  const {
    updateVehicle,
    isLoading: isUpdating,
    error: apiError,
  } = useUpdateVehicle(vehicleId);
  const { deleteVehicle } = useDeleteVehicle(vehicleId);
  // 未保存の変更を破棄する前の確認ダイアログ制御
  const {
    isOpen: isDiscardOpen,
    guard,
    confirm: confirmDiscard,
    cancel: cancelDiscard,
  } = useDiscardGuard();
  // 削除確認ダイアログの表示状態
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // 表示モード（閲覧/編集）を管理するstate
  const [mode, setMode] = useState<"view" | "edit">("view");
  // 選択中の画像ファイルを管理するstate
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 動的ヘッダーにタイトルを登録
  useHeader({ title: "車両詳細" });

  // フォームバリデーションスキーマの初期化
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: EMPTY_VEHICLE_FORM_VALUES,
  });

  // formStateはレンダリング中に参照して初めて内部の購読が有効化され、値が更新されるようになる
  // （react-hook-formの仕様）。ハンドラー内でのみ参照すると常にfalseのまま変化しないため、
  // ここで明示的に読み出しておく。
  const { isDirty } = form.formState;

  // 車両詳細・選択肢の取得完了後、フォーム初期値と画像プレビューへ反映する
  useEffect(() => {
    if (!vehicle || !formOptions) {
      return;
    }

    // VehicleDetailにはmanufacturerNameのみ含まれるため、選択肢一覧から名称一致でIDを逆引きする
    const manufacturerId = formOptions.manufacturers.find(
      (manufacturer) => manufacturer.name === vehicle.manufacturerName,
    )?.id;

    form.reset({
      modelName: vehicle.modelName,
      manufacturerId: manufacturerId ? String(manufacturerId) : "",
      modelCode: vehicle.modelCode ?? "",
      engineCode: vehicle.engineCode ?? "",
      modelYear: String(vehicle.modelYear),
      licensePlate: vehicle.licensePlate ?? "",
      currentMileage: String(vehicle.currentMileage),
      transmissionType: vehicle.transmissionType,
      driveType: vehicle.driveType,
      memo: vehicle.memo ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.resetの度に再実行させないため意図的にform自体を依存配列から除外
  }, [vehicle, formOptions]);

  // 新規に選択された画像ファイルからプレビュー用のオブジェクトURLを生成する
  const newImagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  // 生成したオブジェクトURLをアンマウント・変更時に解放する
  useEffect(() => {
    return () => {
      if (newImagePreviewUrl) {
        URL.revokeObjectURL(newImagePreviewUrl);
      }
    };
  }, [newImagePreviewUrl]);

  const isPending = isVehiclePending || isOptionsPending;
  const isErrorState =
    isVehicleError || isOptionsError || !vehicle || !formOptions;

  // データ取得中はスケルトンUIを表示
  if (isPending) {
    return <VehicleFormSkeleton />;
  }

  // データの取得に失敗した場合
  if (isErrorState) {
    return (
      <ErrorState
        onRetry={() => {
          refetchVehicle();
          refetchOptions();
        }}
      />
    );
  }

  // 新規選択された画像があればそのプレビュー、なければ登録済みの車両画像を表示する
  const imagePreviewUrl = imageFile ? newImagePreviewUrl : vehicle.imageUrl;

  /**
   * 表示モード切り替え時のハンドラー
   *
   * 編集モードから閲覧モードへ戻す際、未保存の変更があれば確認ダイアログを挟む。
   *
   * @param next 切り替え後のモード
   */
  const handleModeChange = (next: "view" | "edit") => {
    if (next === "edit") {
      setMode("edit");
      return;
    }

    guard(isDirty, () => {
      form.reset();
      setImageFile(null);
      setMode("view");
    });
  };

  /**
   * 一覧へ戻るボタン押下時のハンドラー
   *
   * URLの ownerId を引き継ぐことで、SHOPが特定顧客の車両一覧から遷移してきた場合に
   * 同じ絞り込み一覧へ戻れるようにする。
   */
  const handleBackToList = () => {
    guard(mode === "edit" && isDirty, () =>
      router.push(vehicleListRoute(ownerId)),
    );
  };

  /**
   * フォーム送信（更新）時のハンドラー
   *
   * @param data バリデーション済みのフォーム入力値
   */
  const handleSubmit = async (data: VehicleFormValues) => {
    const success = await updateVehicle(
      toCreateVehicleRequest(data, VEHICLE_TYPE),
      imageFile,
    );
    if (success) {
      setImageFile(null);
      setMode("view");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {/* 一覧へ戻るボタン */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBackToList}
          className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          一覧へ戻る
        </Button>

        {/* 閲覧モード/編集モードの切り替え（車両所有者本人のみ表示。SHOPが顧客車両を
            閲覧している場合（canEdit=false）は切り替えUI自体を表示しない） */}
        {vehicle.canEdit && (
          <SegmentedToggle
            options={MODE_OPTIONS}
            value={mode}
            onChange={handleModeChange}
            ariaLabel="表示モード"
          />
        )}
      </div>

      <Card className="bg-card border-border">
        <CardContent>
          <VehicleForm
            form={form}
            mode={mode}
            formOptions={formOptions}
            imagePreviewUrl={imagePreviewUrl}
            onImageSelect={setImageFile}
            onSubmit={handleSubmit}
            onDelete={vehicle.canEdit ? () => setIsDeleteOpen(true) : undefined}
            isSubmitting={isUpdating}
            apiError={apiError}
          />
        </CardContent>
      </Card>

      {/* 未保存の編集内容破棄確認ダイアログ */}
      <ConfirmDialog
        open={isDiscardOpen}
        onOpenChange={cancelDiscard}
        title="編集内容を破棄しますか？"
        description="保存されていない変更は失われます。"
        confirmLabel="破棄する"
        variant="destructive"
        onConfirm={confirmDiscard}
      />

      {/* 車両削除確認ダイアログ */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="この車両を削除しますか？"
        description="削除すると元に戻せません。"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={() => {
          setIsDeleteOpen(false);
          deleteVehicle();
        }}
      />
    </div>
  );
}
