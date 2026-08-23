"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Pagination } from "@/shared/ui/pagination";
import { ErrorState } from "@/shared/components/state/error-state";
import { MaintenanceRecordListSkeleton } from "./maintenance-record-list-skeleton";
import { MaintenanceRecordCard } from "./maintenance-record-card";
import { MaintenanceTypeFilter } from "./maintenance-type-filter";
import { VehicleFilterSelect } from "./maintenance-record-vehicle-filter";
import { useMaintenanceRecordList } from "../hooks/use-maintenance-record-list";
import { useHeader } from "@/shared/hooks/use-header";
import {
  buildReturnTo,
  maintenanceRecordNewRoute,
  vehicleListRoute,
} from "@/shared/constants/routes";
import { formatOwnerScopedTitle } from "@/shared/utils/format";
import type { MaintenanceType } from "@/shared/constants/maintenance-type";
import {
  MAINTENANCE_RECORD_SORT,
  type MaintenanceRecordSort,
} from "../types/maintenance-record";

/** 1ページあたりの表示件数（現状は固定。件数選択UIは今回のスコープ外） */
const DEFAULT_PAGE_SIZE = 20;

/** 並び替え選択肢 */
const SORT_OPTIONS: { value: MaintenanceRecordSort; label: string }[] = [
  { value: MAINTENANCE_RECORD_SORT.WORK_DATE_DESC, label: "日付（新しい順）" },
  { value: MAINTENANCE_RECORD_SORT.WORK_DATE_ASC, label: "日付（古い順）" },
];

/**
 * 整備履歴一覧画面表示用メインコンテンツコンポーネント
 *
 * @component
 * @returns 整備履歴一覧コンテンツのJSX要素
 */
export function MaintenanceRecordListContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 車両フィルターの選択中車両ID（未指定＝すべて）
  const vehicleId = searchParams.get("vehicleId") ?? undefined;
  // 遷移元から引き継いだ対象オーナーID（この画面からは変更しない）。
  // vehicleId指定時は所有者が一意に決まるため、ownerIdはAPI制約
  // （VEHICLE_ID_OWNER_ID_CONFLICT）に抵触しないよう無視する
  const ownerId = vehicleId
    ? undefined
    : (searchParams.get("ownerId") ?? undefined);
  // 選択中の整備種別（複数可、空＝すべて）
  const maintenanceTypes = searchParams.getAll(
    "maintenanceType",
  ) as MaintenanceType[];
  // 検索キーワード（URL上の確定値）
  const keywordParam = searchParams.get("keyword") ?? "";
  // 並び替え条件
  const sort =
    (searchParams.get("sort") as MaintenanceRecordSort | null) ??
    MAINTENANCE_RECORD_SORT.WORK_DATE_DESC;
  // 現在のページ番号
  const page = Number(searchParams.get("page") ?? "1") || 1;
  // 1ページあたりの件数
  const size =
    Number(searchParams.get("size") ?? String(DEFAULT_PAGE_SIZE)) ||
    DEFAULT_PAGE_SIZE;

  const { data, isPending, isError, refetch } = useMaintenanceRecordList({
    vehicleId,
    ownerId,
    maintenanceType: maintenanceTypes.length > 0 ? maintenanceTypes : undefined,
    keyword: keywordParam || undefined,
    sort,
    page,
    size,
  });

  // 現在表示している整備履歴の所有者ID（自分自身の場合はundefined）。
  // vehicleId指定時はAPIレスポンス（data.owner）から解決された値、ownerId指定時は
  // URLの値がそのまま該当する。車両フィルターの選択肢取得・「一覧へ戻る」・「すべて」への
  // 切り替え時のownerId補完で共通して使う
  const viewedOwnerId = data?.owner?.id;

  // 詳細/登録画面へ引き継ぐ、キャンセル時の戻り先としての現在のURL
  const returnTo = useMemo(
    () => buildReturnTo(pathname, searchParams),
    [pathname, searchParams],
  );

  // 検索バーの開閉状態（URLに既にkeywordが設定されている場合は開いた状態から始める）
  const [isSearchOpen, setIsSearchOpen] = useState(() => !!keywordParam);
  // 検索欄への入力途中の値（デバウンスでURLへコミットする前の値）
  const [keywordInput, setKeywordInput] = useState(keywordParam);

  /**
   * 現在のURLクエリパラメータを起点に、指定キーのみを更新したURLへ遷移する
   *
   * @param updates   更新するクエリパラメータ（値がnullの場合はキー自体を削除）
   * @param resetPage trueの場合、pageパラメータをリセットする
   */
  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>, resetPage: boolean) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        next.delete(key);
        if (value === null) {
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((v) => next.append(key, v));
        } else {
          next.set(key, value);
        }
      });

      if (resetPage) {
        next.delete("page");
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  // キーワード入力のデバウンス。入力が一定時間止まったらURLへ反映し、pageを1へリセットする
  useEffect(() => {
    const trimmed = keywordInput.trim();

    if (trimmed === keywordParam) {
      return;
    }

    const timer = setTimeout(() => {
      updateParams({ keyword: trimmed || null }, true);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keywordInputの変化のみで発火させるため意図的に除外
  }, [keywordInput]);

  /**
   * 車両フィルター変更時のハンドラー（pageを1へリセット）
   *
   * vehicleId・ownerIdはAPI制約上同時にURLへ乗せられないため、どちらに切り替える
   * 場合も常に両方のキーを明示的に管理する。「すべて」への切り替え時は、直前まで
   * 見ていた対象の所有者（viewedOwnerId）をownerIdとして引き継ぐことで、
   * 顧客の車両を見ていた場合はその顧客の全車両分の一覧に留まる（自分の一覧には戻らない）。
   *
   * @param next 選択された車両ID（未指定＝「すべて」）
   */
  const handleVehicleChange = (next?: string) => {
    if (next) {
      updateParams({ vehicleId: next, ownerId: null }, true);
      return;
    }
    updateParams({ vehicleId: null, ownerId: viewedOwnerId ?? null }, true);
  };

  /**
   * 整備種別フィルター変更時のハンドラー（pageを1へリセット）
   *
   * @param types 選択された整備種別（空配列＝「すべて」）
   */
  const handleTypeChange = (types: MaintenanceType[]) => {
    updateParams({ maintenanceType: types.length > 0 ? types : null }, true);
  };

  /**
   * 並び替え変更時のハンドラー（pageを1へリセット）
   *
   * @param next 変更後の並び替え条件
   */
  const handleSortChange = (next: MaintenanceRecordSort) => {
    updateParams(
      { sort: next === MAINTENANCE_RECORD_SORT.WORK_DATE_DESC ? null : next },
      true,
    );
  };

  /**
   * ページ変更時のハンドラー（他の絞り込み条件は維持する）
   *
   * @param next 変更後のページ番号
   */
  const handlePageChange = (next: number) => {
    updateParams({ page: next === 1 ? null : String(next) }, false);
  };

  // ownerId指定時は対象オーナーの表示名を、未指定時は固定タイトルを表示する
  const title = formatOwnerScopedTitle(data?.owner?.userName, "整備履歴一覧");

  // データ取得完了かつエラーが無い場合のみ、ヘッダーへ検索・追加アクションを表示する
  const showActions = !isPending && !isError && !!data;

  // ヘッダー右側に表示する検索・追加ボタン群（keywordInputは依存配列に含めず、
  // 日本語入力中の再生成による文字化けを防ぐ。vehicle-list-content.tsxと同様の対応）
  const actions = useMemo(() => {
    if (!showActions) {
      return undefined;
    }

    return (
      <div className="flex items-center gap-2">
        {isSearchOpen ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              defaultValue={keywordParam}
              placeholder="タイトルで検索"
              onChange={(e) => setKeywordInput(e.target.value)}
              className="h-8 w-36 sm:w-56"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="検索を閉じる"
              onClick={() => {
                setIsSearchOpen(false);
                setKeywordInput("");
                updateParams({ keyword: null }, true);
              }}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="タイトルで検索"
            onClick={() => setIsSearchOpen(true)}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        )}

        <Link
          href={maintenanceRecordNewRoute({
            vehicleId,
            ownerId: viewedOwnerId,
            returnTo,
          })}
        >
          <Button type="button" size="sm" className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            履歴を追加
          </Button>
        </Link>
      </div>
    );
  }, [
    showActions,
    isSearchOpen,
    keywordParam,
    updateParams,
    vehicleId,
    viewedOwnerId,
    returnTo,
  ]);

  useHeader({ title, actions });

  /**
   * 「一覧へ戻る」押下時のハンドラー（車両一覧画面へ遷移する）
   */
  const handleBackToList = () => {
    router.push(vehicleListRoute(viewedOwnerId));
  };

  // データ取得中はスケルトンUIを表示
  if (isPending) {
    return <MaintenanceRecordListSkeleton />;
  }

  // データの取得に失敗した場合
  if (isError || !data) {
    return <ErrorState onRetry={refetch} />;
  }

  // 表示対象の整備履歴一覧
  const records = data.records.content;
  // 絞り込み条件が有効かどうか（0件時の空状態メッセージの出し分けに使用）
  const hasActiveFilter = !!keywordParam || maintenanceTypes.length > 0;

  return (
    <div className="space-y-4">
      {/* 一覧へ戻るボタン & 絞り込み・並び替え操作エリア */}
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

        <div className="flex items-center gap-2">
          {/* 車両フィルタープルダウン（対象車両一覧の所有者はdata.ownerから解決する） */}
          <VehicleFilterSelect
            ownerId={viewedOwnerId}
            value={vehicleId}
            onChange={handleVehicleChange}
          />

          {/* 並び替えプルダウン */}
          <Select
            value={sort}
            onValueChange={(value) =>
              handleSortChange(value as MaintenanceRecordSort)
            }
          >
            <SelectTrigger className="w-auto min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 整備種別フィルター */}
      <MaintenanceTypeFilter
        selected={maintenanceTypes}
        onChange={handleTypeChange}
      />

      {records.length === 0 ? (
        /* 整備履歴が0件の場合の空状態表示 */
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {hasActiveFilter
            ? "該当する整備履歴が見つかりません"
            : "登録されている整備履歴がありません"}
        </div>
      ) : (
        /* 整備履歴カード一覧 */
        <div className="flex flex-col gap-4">
          {records.map((record) => (
            <MaintenanceRecordCard
              key={record.id}
              record={record}
              ownerId={viewedOwnerId}
              returnTo={returnTo}
            />
          ))}
        </div>
      )}

      {/* ページング */}
      {records.length > 0 && (
        <Pagination
          page={data.records.page}
          totalPages={data.records.totalPages}
          totalElements={data.records.totalElements}
          onPageChange={handlePageChange}
          className="pt-2"
        />
      )}
    </div>
  );
}
