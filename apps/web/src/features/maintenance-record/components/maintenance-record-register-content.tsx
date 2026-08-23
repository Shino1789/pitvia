"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/shared/ui/card";
import { ErrorState } from "@/shared/components/state/error-state";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { MaintenanceRecordForm } from "./maintenance-record-form";
import { MaintenanceRecordFormSkeleton } from "./maintenance-record-form-skeleton";
import { useVehicleList } from "@/features/vehicle/hooks/use-vehicle-list";
import { useRegisterMaintenanceRecord } from "../hooks/use-register-maintenance-record";
import {
  maintenanceRecordSchema,
  toCreateMaintenanceRecordRequest,
  EMPTY_MAINTENANCE_RECORD_FORM_VALUES,
  EMPTY_WORK_ITEM_FORM_VALUES,
  type MaintenanceRecordFormValues,
} from "../schemas/maintenance-record.schema";
import { useHeader } from "@/shared/hooks/use-header";
import { useDiscardGuard } from "@/shared/hooks/use-discard-guard";
import { useReturnTo } from "@/shared/hooks/use-return-to";
import { ROUTES } from "@/shared/constants/routes";
import { formatOwnerScopedTitle } from "@/shared/utils/format";

/**
 * 整備履歴登録画面表示用メインコンテンツコンポーネント
 *
 * @component
 * @returns 整備履歴登録コンテンツのJSX要素
 */
export function MaintenanceRecordRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 一覧画面から車両ごとに絞り込んだ状態で遷移してきた場合、対象車両プルダウンの初期選択値にする
  const vehicleIdParam = searchParams.get("vehicleId") ?? undefined;
  // 一覧画面から引き継いだ、対象車両一覧の取得元オーナーID
  const ownerIdParam = searchParams.get("ownerId") ?? undefined;
  // キャンセル・登録完了時に戻る一覧画面のパス（一覧画面から引き継いだ`returnTo`。未指定時は
  // 通常の整備履歴一覧へ戻る）
  const returnTo = useReturnTo(ROUTES.MAINTENANCES);

  // 対象車両の選択肢取得。ownerIdParam指定時はその顧客の車両一覧、未指定時は
  // ログインユーザー自身の車両一覧（OWNERは自身の所有車両、SHOPは自身の所有車両が対象）
  const {
    data: vehicleListResponse,
    isPending: isVehiclesPending,
    isError: isVehiclesError,
    refetch: refetchVehicles,
  } = useVehicleList(ownerIdParam);

  // 整備履歴登録処理カスタムフックから状態と関数を取得
  const {
    registerMaintenanceRecord,
    isLoading,
    error: apiError,
  } = useRegisterMaintenanceRecord();
  // 未保存の変更を破棄する前の確認ダイアログ制御
  const { isOpen, guard, confirm, cancel } = useDiscardGuard();

  // 作業項目ごとに選択された画像ファイル（キー: useFieldArrayの安定id）
  const [workItemImages, setWorkItemImages] = useState<Map<string, File>>(
    new Map(),
  );

  // 作業項目ごとの画像プレビューURLは、選択中ファイルから都度導出する（vehicle-register-content.tsxと
  // 同じ方式）。stateとして個別管理すると生成・解放のタイミング管理が煩雑になり、
  // 画面遷移時にオブジェクトURLが解放されずメモリリークする原因になるため避ける
  const imagePreviewUrls = useMemo(() => {
    const map = new Map<string, string>();
    workItemImages.forEach((file, fieldId) => {
      map.set(fieldId, URL.createObjectURL(file));
    });
    return map;
  }, [workItemImages]);

  // 導出したオブジェクトURLは、再生成・アンマウントの度に確実に解放する
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  // 動的ヘッダーにタイトルを登録。連携済み顧客の車両を対象に登録している場合は対象オーナー名を表示する
  useHeader({
    title: formatOwnerScopedTitle(
      vehicleListResponse?.owner?.userName,
      "整備履歴登録",
    ),
  });

  // フォームバリデーションスキーマの初期化。URLに対象車両が指定されている場合は初期選択値にする
  const form = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      ...EMPTY_MAINTENANCE_RECORD_FORM_VALUES,
      vehicleId:
        vehicleIdParam ?? EMPTY_MAINTENANCE_RECORD_FORM_VALUES.vehicleId,
    },
  });

  // formStateはレンダリング中に参照して初めて内部の購読が有効化される（react-hook-formの仕様）
  const { isDirty } = form.formState;
  // 画像はreact-hook-formの管理外のため、画像を選択した場合の判定用フラグ
  const hasUnsavedChanges = isDirty || workItemImages.size > 0;

  // 作業項目リストの動的追加・削除
  const {
    fields: workItemFields,
    append: appendWorkItem,
    remove: removeWorkItem,
  } = useFieldArray({ control: form.control, name: "workItems" });

  /**
   * 作業項目に紐づく選択画像を削除する（画像削除ボタン押下時、作業項目削除時の両方で利用）
   *
   * @param fieldId 対象作業項目の安定id
   */
  const removeImageForField = (fieldId: string) => {
    setWorkItemImages((prev) => {
      const next = new Map(prev);
      next.delete(fieldId);
      return next;
    });
  };

  /**
   * 「＋作業項目を追加」押下時のハンドラー
   */
  const handleAddWorkItem = () => {
    appendWorkItem({ ...EMPTY_WORK_ITEM_FORM_VALUES });
  };

  /**
   * 作業項目削除ボタン押下時のハンドラー
   *
   * @param index 削除対象のworkItems配列内インデックス
   */
  const handleRemoveWorkItem = (index: number) => {
    const fieldId = workItemFields[index]?.id;
    removeWorkItem(index);
    if (fieldId) {
      removeImageForField(fieldId);
    }
  };

  /**
   * 作業項目の画像選択時のハンドラー
   *
   * @param fieldId 対象作業項目の安定id
   * @param file    選択された画像ファイル
   */
  const handleWorkItemImageSelect = (fieldId: string, file: File) => {
    setWorkItemImages((prev) => new Map(prev).set(fieldId, file));
  };

  // データ取得中はスケルトンUIを表示
  if (isVehiclesPending) {
    return <MaintenanceRecordFormSkeleton />;
  }

  // データの取得に失敗した場合
  if (isVehiclesError || !vehicleListResponse) {
    return <ErrorState onRetry={refetchVehicles} />;
  }

  const vehicleOptions = vehicleListResponse.vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: vehicle.modelCode
      ? `${vehicle.modelName} ${vehicle.modelCode}`
      : vehicle.modelName,
  }));

  /**
   * キャンセルボタン押下時のハンドラー
   */
  const handleCancel = () => {
    guard(hasUnsavedChanges, () => router.push(returnTo));
  };

  /**
   * フォーム送信時のハンドラー
   *
   * @param data バリデーション済みのフォーム入力値
   */
  const handleSubmit = (data: MaintenanceRecordFormValues) => {
    // useFieldArrayの現在の並び順（＝送信時のworkItems配列インデックス）に対応させて、
    // fieldIdキーのMapをインデックスキーのMapへ変換する
    const indexedImages = new Map<number, File>();
    workItemFields.forEach((field, index) => {
      const file = workItemImages.get(field.id);
      if (file) {
        indexedImages.set(index, file);
      }
    });

    registerMaintenanceRecord(
      toCreateMaintenanceRecordRequest(data),
      indexedImages,
      returnTo,
    );
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent>
          <MaintenanceRecordForm
            form={form}
            mode="create"
            vehicleOptions={vehicleOptions}
            workItemFields={workItemFields}
            onAddWorkItem={handleAddWorkItem}
            onRemoveWorkItem={handleRemoveWorkItem}
            getWorkItemImagePreviewUrl={(fieldId) =>
              imagePreviewUrls.get(fieldId) ?? null
            }
            onWorkItemImageSelect={handleWorkItemImageSelect}
            onWorkItemImageRemove={removeImageForField}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
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
