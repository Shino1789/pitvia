"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, PencilIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import {
  SegmentedToggle,
  type SegmentedToggleOption,
} from "@/shared/ui/segmented-toggle";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { MaintenanceRecordForm } from "./maintenance-record-form";
import { useVehicleList } from "@/features/vehicle/hooks/use-vehicle-list";
import {
  maintenanceRecordSchema,
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
 * - （エントリ無し）: 未操作。元画像（{@link MaintenanceRecordDetailContent}内の`originalImageUrls`）のまま
 */
type WorkItemImageState = { type: "replaced"; file: File } | { type: "removed" };

/**
 * 整備履歴詳細・更新画面の表示・動作確認用モックデータ
 *
 * TODO: 詳細取得API（`GET /maintenance-records/{id}`）実装後、`useQuery`による取得へ差し替える。
 * 今回のスコープでは詳細取得APIが未実装のため、登録画面とのUI共通化（閲覧/編集モード切り替え、
 * モード別フッター、登録者本人のみ編集可）を確認できる状態に留める。
 */
export const MOCK_MAINTENANCE_RECORD_DETAIL: MaintenanceRecordDetail = {
  id: "mock-maintenance-record-id",
  vehicleId: "mock-vehicle-id",
  vehicleModelName: "GT-R",
  vehicleModelCode: "R32",
  title: "車検対応",
  maintenanceType: "VEHICLE_INSPECTION",
  workDateFrom: "2026-04-10",
  workDateTo: "2026-04-10",
  mileage: 70600,
  remarks: null,
  shopName: null,
  workItems: [
    {
      id: 1,
      maintenanceCategory: "ENGINE",
      workContent: "エンジンオイル交換",
      performedBy: "山岸 大地",
      laborCost: 2000,
      imageUrl: null,
      parts: [],
    },
  ],
  // 車両所有者/SHOP権限ではなく、この整備履歴を登録したユーザー本人かどうかで決まる
  // （バックエンドが判定してレスポンスに含める想定。vehicle.canEditと同じ設計）
  canEdit: true,
};

/**
 * 整備履歴詳細情報を、フォーム入力値の形式へ変換する
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
      maintenanceCategory: item.maintenanceCategory,
      workContent: item.workContent,
      performedBy: item.performedBy,
      laborCost: String(item.laborCost),
      parts: item.parts.map((part) => ({
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
 * Props型定義
 */
interface MaintenanceRecordDetailContentProps {
  /**
   * 表示対象の整備履歴詳細データ
   *
   * 詳細取得APIが未実装のため、未指定時は{@link MOCK_MAINTENANCE_RECORD_DETAIL}を使用する。
   * テストから任意のデータ（`canEdit: false`等）を注入できるようprops化している。
   */
  record?: MaintenanceRecordDetail;
}

/**
 * 整備履歴詳細・更新画面表示用メインコンテンツコンポーネント
 *
 * 登録画面（{@link MaintenanceRecordRegisterContent}）とフォームUIを共通化し、
 * 閲覧/編集モードの切り替え、モードに応じたフッター表示を提供する。
 *
 * 詳細取得・更新・削除APIとの連携は今回のスコープ対象外のため未実装（API未実装により
 * 保存・削除操作はコンソール出力のみで実際のリクエストは送信しない）。
 *
 * @component
 * @returns 整備履歴詳細コンテンツのJSX要素
 */
export function MaintenanceRecordDetailContent({
  record = MOCK_MAINTENANCE_RECORD_DETAIL,
}: MaintenanceRecordDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 一覧画面から引き継いだキャンセル時の遷移先URLを取得
  const returnTo = useReturnTo(ROUTES.MAINTENANCES);

  // 一覧画面から引き継いだ、対象車両一覧の取得元オーナーID。ヘッダーへの対象オーナー名表示にのみ
  // 使用する（詳細取得API未実装のため、この画面自体の対象車両プルダウンは持たない）
  const ownerIdParam = searchParams.get("ownerId") ?? undefined;
  const { data: vehicleListResponse } = useVehicleList(ownerIdParam);

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

  // フォームバリデーションスキーマの初期化（詳細データをそのまま初期値として利用）
  const form = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: toFormValues(record),
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

  // 各作業項目の元画像URL（キー: useFieldArrayの安定id）。マウント時の並び順を基準に一度だけ
  // 記録し、以降は作業項目の追加・削除・並び替えが起きてもfieldId単位で正しく参照できるようにする
  const [originalImageUrls] = useState<Map<string, string | null>>(
    () =>
      new Map(
        workItemFields.map((field, index) => [
          field.id,
          record.workItems[index]?.imageUrl ?? null,
        ]),
      ),
  );

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
      form.reset(toFormValues(record));
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
   * 更新API（`PUT /maintenance-records/{id}`）は今回のスコープ外のため未実装。
   * 実際のAPIリクエストは送信せず、閲覧モードへ戻すのみに留める。
   *
   * @param data バリデーション済みのフォーム入力値
   */
  const handleSubmit = (data: MaintenanceRecordFormValues) => {
    // TODO: 更新API実装後、maintenanceRecordApi.update(...) 相当の呼び出しへ差し替える。
    console.info(
      "整備履歴の更新APIは未実装のため、送信内容は保存されません。",
      data,
    );
    // 編集中の画像状態を直近保存済みの状態へ反映し、未保存の変更フラグをクリアする。
    // これを怠ると、閲覧モードへ戻った後に再度編集モードへ入っただけで、直前の保存内容が
    // 「未保存の変更」として誤検出されてしまう
    setSavedWorkItemImageStates(workItemImageStates);
    setHasPendingImageChanges(false);
    setMode("view");
  };

  /**
   * 削除確認ダイアログの確定ボタン押下時のハンドラー
   *
   * 削除API（`DELETE /maintenance-records/{id}`）は今回のスコープ外のため未実装。
   */
  const handleDelete = () => {
    // TODO: 削除API実装後、maintenanceRecordApi.remove(...) 相当の呼び出しへ差し替える。
    console.info("整備履歴の削除APIは未実装のため、削除は実行されません。");
    setIsDeleteOpen(false);
  };

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
              return originalImageUrls.get(fieldId) ?? null;
            }}
            onWorkItemImageSelect={handleWorkItemImageSelect}
            onWorkItemImageRemove={handleWorkItemImageRemove}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
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
        onConfirm={handleDelete}
      />
    </div>
  );
}
