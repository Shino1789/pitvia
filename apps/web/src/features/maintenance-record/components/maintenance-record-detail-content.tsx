"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, PencilIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import {
  SegmentedToggle,
  type SegmentedToggleOption,
} from "@/shared/ui/segmented-toggle";
import { ErrorState } from "@/shared/components/state/error-state";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { MaintenanceRecordForm } from "./maintenance-record-form";
import { MaintenanceRecordFormSkeleton } from "./maintenance-record-form-skeleton";
import { useVehicleList } from "@/features/vehicle/hooks/use-vehicle-list";
import { useMaintenanceRecordDetail } from "../hooks/use-maintenance-record-detail";
import { useUpdateMaintenanceRecord } from "../hooks/use-update-maintenance-record";
import { useDeleteMaintenanceRecord } from "../hooks/use-delete-maintenance-record";
import {
  maintenanceRecordSchema,
  toUpdateMaintenanceRecordRequest,
  EMPTY_MAINTENANCE_RECORD_FORM_VALUES,
  EMPTY_WORK_ITEM_FORM_VALUES,
  type MaintenanceRecordFormValues,
} from "../schemas/maintenance-record.schema";
import type { MaintenanceRecordDetail } from "../types/maintenance-record";
import { useHeader } from "@/shared/hooks/use-header";
import { useDiscardGuard } from "@/shared/hooks/use-discard-guard";
import { useReturnTo } from "@/shared/hooks/use-return-to";
import { ROUTES } from "@/shared/constants/routes";
import { formatOwnerScopedTitle } from "@/shared/utils/format";

/** 閲覧モード/編集モードの切り替え選択肢 */
const MODE_OPTIONS: SegmentedToggleOption<"view" | "edit">[] = [
  { value: "view", label: "閲覧モード", icon: EyeIcon },
  { value: "edit", label: "編集モード", icon: PencilIcon },
];

/**
 * 作業項目1件分の画像に対する、元画像からの変更状態（キー: useFieldArrayの安定id）
 *
 * - `replaced`: 新しい画像に差し替え中
 * - `removed`: 元画像を明示的に削除
 * - （エントリ無し）: 未操作。元画像（{@link MaintenanceRecordDetailContent}内の
 *   `originalImageUrlByWorkItemId`）のまま
 */
type WorkItemImageState = { type: "replaced"; file: File } | { type: "removed" };

/**
 * 整備履歴詳細情報を、フォーム入力値の形式へ変換する
 *
 * 各作業項目・部品には、更新APIで差分反映するためのサーバー側ID（`workItemId`/`partId`）を
 * 併せて保持させる（ユーザーが編集する項目ではない。react-hook-formのuseFieldArrayが
 * 内部管理するキーとは別物）。
 *
 * @param record 整備履歴詳細情報
 * @returns フォーム入力値
 */
function toFormValues(
  record: MaintenanceRecordDetail,
): MaintenanceRecordFormValues {
  return {
    vehicleId: record.vehicleId,
    title: record.title,
    maintenanceType: record.maintenanceType,
    workDateFrom: record.workDateFrom,
    workDateTo: record.workDateTo ?? "",
    mileage: String(record.mileage),
    remarks: record.remarks ?? "",
    workItems: record.workItems.map((item) => ({
      workItemId: item.id,
      maintenanceCategory: item.maintenanceCategory,
      workContent: item.workContent,
      performedBy: item.performedBy,
      laborCost: String(item.laborCost),
      parts: item.parts.map((part) => ({
        partId: part.id,
        partCondition: part.partCondition ?? "",
        partName: part.partName,
        manufacturerName: part.manufacturerName ?? "",
        partModelNumber: part.partModelNumber ?? "",
        quantity: String(part.quantity),
        unitPrice: String(part.unitPrice),
      })),
    })),
  };
}

/**
 * 整備履歴詳細・更新画面表示用メインコンテンツコンポーネント
 *
 * 登録画面（{@link MaintenanceRecordRegisterContent}）とフォームUIを共通化し、
 * 閲覧/編集モードの切り替え、モードに応じたフッター表示を提供する。
 *
 * @component
 * @returns 整備履歴詳細コンテンツのJSX要素
 */
export function MaintenanceRecordDetailContent() {
  // 動的ルートパラメータから整備履歴IDを取得
  const { maintenanceRecordId } = useParams<{ maintenanceRecordId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 一覧画面から引き継いだキャンセル・削除時の遷移先URLを取得
  const returnTo = useReturnTo(ROUTES.MAINTENANCES);

  // 一覧画面から引き継いだ、対象車両一覧の取得元オーナーID。ヘッダーへの対象オーナー名表示にのみ
  // 使用する（この画面自体の対象車両プルダウンは持たない。登録画面と同じ方式）
  const ownerIdParam = searchParams.get("ownerId") ?? undefined;
  const { data: vehicleListResponse } = useVehicleList(ownerIdParam);

  // 整備履歴詳細取得カスタムフックから状態を取得
  const {
    data: record,
    isPending: isRecordPending,
    isError: isRecordError,
    refetch: refetchRecord,
  } = useMaintenanceRecordDetail(maintenanceRecordId);

  // 整備履歴更新・削除処理カスタムフックから状態と関数を取得
  const {
    updateMaintenanceRecord,
    isLoading: isUpdating,
    error: apiError,
  } = useUpdateMaintenanceRecord(maintenanceRecordId);
  const { deleteMaintenanceRecord } = useDeleteMaintenanceRecord(maintenanceRecordId);

  // 表示モード（閲覧/編集）を管理するstate
  const [mode, setMode] = useState<"view" | "edit">("view");
  // 未保存の変更を破棄する前の確認ダイアログ制御
  const {
    isOpen: isDiscardOpen,
    guard,
    confirm: confirmDiscard,
    cancel: cancelDiscard,
  } = useDiscardGuard();
  // 削除確認ダイアログの表示状態
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // 直近保存済みの作業項目画像状態（閲覧モードでの表示、および編集キャンセル時の復元先）
  const [savedWorkItemImageStates, setSavedWorkItemImageStates] = useState<
    Map<string, WorkItemImageState>
  >(new Map());
  // 編集中の作業項目画像状態（保存するとsavedWorkItemImageStatesへ反映される）
  const [workItemImageStates, setWorkItemImageStates] = useState<
    Map<string, WorkItemImageState>
  >(new Map());
  // 今回の編集セッションで画像に変更（差し替え・削除）が加えられたかどうか
  const [hasPendingImageChanges, setHasPendingImageChanges] = useState(false);

  // 動的ヘッダーにタイトルを登録。連携済み顧客の車両を対象に閲覧・編集している場合は
  // 対象オーナー名を表示する
  useHeader({
    title: formatOwnerScopedTitle(
      vehicleListResponse?.owner?.userName,
      "整備履歴詳細",
    ),
  });

  // フォームバリデーションスキーマの初期化。実データはuseEffectで取得後に反映する
  const form = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: EMPTY_MAINTENANCE_RECORD_FORM_VALUES,
  });

  const { isDirty } = form.formState;
  // 閲覧モードでは編集操作自体が無いため、編集モード時のみ未保存判定を行う
  const hasUnsavedChanges = mode === "edit" && (isDirty || hasPendingImageChanges);

  // 作業項目リストの動的追加・削除
  const {
    fields: workItemFields,
    append: appendWorkItem,
    remove: removeWorkItem,
  } = useFieldArray({ control: form.control, name: "workItems" });

  // 整備履歴の取得完了後、フォーム初期値へ反映する（vehicle-detail-content.tsxと同じパターン）
  useEffect(() => {
    if (!record) {
      return;
    }
    form.reset(toFormValues(record));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.resetの度に再実行させないため意図的にform自体を依存配列から除外
  }, [record]);

  // 作業項目のサーバー側ID → 元の整備画像URL。新規追加した作業項目（workItemId未設定）には存在しない
  const originalImageUrlByWorkItemId = useMemo(() => {
    const map = new Map<number, string | null>();
    record?.workItems.forEach((item) => map.set(item.id, item.imageUrl));
    return map;
  }, [record]);

  // 現在の表示モードに応じて参照する画像状態（閲覧モードは直近保存済み、編集モードは編集中のもの）
  const activeImageStates =
    mode === "edit" ? workItemImageStates : savedWorkItemImageStates;

  // 差し替え中（type: "replaced"）の画像のみ、プレビュー用オブジェクトURLを導出する
  const imagePreviewUrls = useMemo(() => {
    const map = new Map<string, string>();
    activeImageStates.forEach((state, fieldId) => {
      if (state.type === "replaced") {
        map.set(fieldId, URL.createObjectURL(state.file));
      }
    });
    return map;
  }, [activeImageStates]);

  // 導出したオブジェクトURLは、再生成・アンマウントの度に確実に解放する
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  /**
   * 作業項目の画像削除ボタン押下時のハンドラー（元画像がある場合、明示的な削除として記録する）
   *
   * @param fieldId 対象作業項目の安定id
   */
  const handleWorkItemImageRemove = (fieldId: string) => {
    setWorkItemImageStates((prev) => new Map(prev).set(fieldId, { type: "removed" }));
    setHasPendingImageChanges(true);
  };

  /**
   * 作業項目の画像選択時のハンドラー
   *
   * @param fieldId 対象作業項目の安定id
   * @param file    選択された画像ファイル
   */
  const handleWorkItemImageSelect = (fieldId: string, file: File) => {
    setWorkItemImageStates((prev) =>
      new Map(prev).set(fieldId, { type: "replaced", file }),
    );
    setHasPendingImageChanges(true);
  };

  /**
   * 作業項目そのものが削除された際、紐づく画像状態を後始末する（明示的な削除操作ではないため、
   * hasPendingImageChangesはisDirty側で既に検知されるフォームの削除操作に委ねる）
   *
   * @param fieldId 削除された作業項目の安定id
   */
  const handleWorkItemRowRemoved = (fieldId: string) => {
    setWorkItemImageStates((prev) => {
      const next = new Map(prev);
      next.delete(fieldId);
      return next;
    });
  };

  /**
   * 表示モード切り替え時のハンドラー
   *
   * @param next 切り替え後のモード
   */
  const handleModeChange = (next: "view" | "edit") => {
    if (next === "edit") {
      setMode("edit");
      return;
    }
    // 未保存の変更があれば確認ダイアログを挟む
    guard(hasUnsavedChanges, () => {
      // 引数無しのreset()は、直近useEffectで設定した取得済みデータの値へ戻す
      // （vehicle-detail-content.tsxと同じパターン）
      form.reset();
      // 編集中の画像状態を直近保存済みの状態へ戻す（破棄）
      setWorkItemImageStates(savedWorkItemImageStates);
      setHasPendingImageChanges(false);
      setMode("view");
    });
  };

  /**
   * キャンセルボタン押下時のハンドラー
   */
  const handleCancel = () => {
    guard(hasUnsavedChanges, () => router.push(returnTo));
  };

  /**
   * フォーム送信（更新）時のハンドラー
   *
   * @param data バリデーション済みのフォーム入力値
   */
  const handleSubmit = async (data: MaintenanceRecordFormValues) => {
    // useFieldArrayの現在の並び順（＝送信時のworkItems配列インデックス）に対応させて、
    // fieldIdキーの画像状態をインデックスキーの情報へ変換する（登録画面と同じ手法）
    const indexedImages = new Map<number, File>();
    const removeImageIndexes = new Set<number>();
    workItemFields.forEach((field, index) => {
      const state = workItemImageStates.get(field.id);
      if (state?.type === "replaced") {
        indexedImages.set(index, state.file);
      } else if (state?.type === "removed") {
        removeImageIndexes.add(index);
      }
    });

    const success = await updateMaintenanceRecord(
      toUpdateMaintenanceRecordRequest(data, removeImageIndexes),
      indexedImages,
    );

    if (success) {
      // 編集中の画像状態を直近保存済みの状態へ反映し、未保存の変更フラグをクリアする。
      // これを怠ると、閲覧モードへ戻った後に再度編集モードへ入っただけで、直前の保存内容が
      // 「未保存の変更」として誤検出されてしまう
      setSavedWorkItemImageStates(workItemImageStates);
      setHasPendingImageChanges(false);
      setMode("view");
    }
  };

  /**
   * 削除確認ダイアログの確定ボタン押下時のハンドラー
   */
  const handleDeleteConfirm = () => {
    setIsDeleteOpen(false);
    deleteMaintenanceRecord(returnTo);
  };

  // データ取得中はスケルトンUIを表示
  if (isRecordPending) {
    return <MaintenanceRecordFormSkeleton />;
  }

  // データの取得に失敗した場合
  if (isRecordError || !record) {
    return <ErrorState onRetry={refetchRecord} />;
  }

  const vehicleLabel = record.vehicleModelCode
    ? `${record.vehicleModelName} ${record.vehicleModelCode}`
    : record.vehicleModelName;

  return (
    <div className="space-y-4">
      {/* 閲覧モード/編集モードの切り替え（登録者本人のみ表示。他ユーザーが登録した履歴を
          閲覧している場合（canEdit=false）は切り替えUI自体を表示しない） */}
      {record.canEdit && (
        <div className="flex justify-end">
          <SegmentedToggle
            options={MODE_OPTIONS}
            value={mode}
            onChange={handleModeChange}
            ariaLabel="表示モード"
          />
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent>
          <MaintenanceRecordForm
            form={form}
            mode={mode}
            vehicleOptions={[]}
            vehicleLabel={vehicleLabel}
            workItemFields={workItemFields}
            onAddWorkItem={() =>
              appendWorkItem({ ...EMPTY_WORK_ITEM_FORM_VALUES })
            }
            onRemoveWorkItem={(index) => {
              const fieldId = workItemFields[index]?.id;
              removeWorkItem(index);
              if (fieldId) {
                handleWorkItemRowRemoved(fieldId);
              }
            }}
            getWorkItemImagePreviewUrl={(fieldId) => {
              const state = activeImageStates.get(fieldId);
              if (state?.type === "replaced") {
                return imagePreviewUrls.get(fieldId) ?? null;
              }
              if (state?.type === "removed") {
                return null;
              }
              // 未操作の場合は、元の整備画像URLをworkItemId経由で参照する
              // （field.workItemIdはuseFieldArrayが保持する当該行のスナップショット値）
              const workItemId = workItemFields.find(
                (field) => field.id === fieldId,
              )?.workItemId;
              return workItemId !== undefined
                ? (originalImageUrlByWorkItemId.get(workItemId) ?? null)
                : null;
            }}
            onWorkItemImageSelect={handleWorkItemImageSelect}
            onWorkItemImageRemove={handleWorkItemImageRemove}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isUpdating}
            apiError={apiError}
            onDelete={
              mode === "edit" && record.canEdit
                ? () => setIsDeleteOpen(true)
                : undefined
            }
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

      {/* 整備履歴削除確認ダイアログ */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="この整備履歴を削除しますか？"
        description="削除すると元に戻せません。"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
