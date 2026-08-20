"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

/** 閲覧モード/編集モードの切り替え選択肢 */
const MODE_OPTIONS: SegmentedToggleOption<"view" | "edit">[] = [
  { value: "view", label: "閲覧モード", icon: EyeIcon },
  { value: "edit", label: "編集モード", icon: PencilIcon },
];

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

  // 一覧画面から引き継いだキャンセル時の遷移先URLを取得
  const returnTo = useReturnTo(ROUTES.MAINTENANCES);

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

  // 作業項目ごとに選択された画像ファイル（キー: useFieldArrayの安定id）
  const [workItemImages, setWorkItemImages] = useState<Map<string, File>>(
    new Map(),
  );
  // 作業項目ごとの画像プレビューURL（キー: useFieldArrayの安定id）
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Map<string, string>>(
    new Map(),
  );

  // 動的ヘッダーにタイトルを登録
  useHeader({ title: "整備履歴詳細" });

  // フォームバリデーションスキーマの初期化（詳細データをそのまま初期値として利用）
  const form = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: toFormValues(record),
  });

  const { isDirty } = form.formState;
  // 閲覧モードでは編集操作自体が無いため、編集モード時のみ未保存判定を行う
  const hasUnsavedChanges =
    mode === "edit" && (isDirty || workItemImages.size > 0);

  // 作業項目リストの動的追加・削除
  const {
    fields: workItemFields,
    append: appendWorkItem,
    remove: removeWorkItem,
  } = useFieldArray({ control: form.control, name: "workItems" });

  // 各作業項目の初期表示用画像URL（インデックス対応。新規に画像が選択された場合はそちらを優先する）
  const initialImageUrls = record.workItems.map((item) => item.imageUrl);

  /**
   * 作業項目に紐づく画像・プレビューURLを削除する
   *
   * @param fieldId 対象作業項目の安定id
   */
  const removeImageForField = (fieldId: string) => {
    setWorkItemImages((prev) => {
      const next = new Map(prev);
      next.delete(fieldId);
      return next;
    });
    setImagePreviewUrls((prev) => {
      const next = new Map(prev);
      const url = next.get(fieldId);
      if (url) {
        URL.revokeObjectURL(url);
      }
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
      workItemImages.forEach((_file, fieldId) => removeImageForField(fieldId));
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
                removeImageForField(fieldId);
              }
            }}
            getWorkItemImagePreviewUrl={(fieldId) => {
              const selected = imagePreviewUrls.get(fieldId);
              if (selected) {
                return selected;
              }
              const index = workItemFields.findIndex((f) => f.id === fieldId);
              return index >= 0 ? (initialImageUrls[index] ?? null) : null;
            }}
            onWorkItemImageSelect={(fieldId, file) => {
              setWorkItemImages((prev) => new Map(prev).set(fieldId, file));
              setImagePreviewUrls((prev) => {
                const next = new Map(prev);
                const oldUrl = next.get(fieldId);
                if (oldUrl) {
                  URL.revokeObjectURL(oldUrl);
                }
                next.set(fieldId, URL.createObjectURL(file));
                return next;
              });
            }}
            onWorkItemImageRemove={removeImageForField}
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
