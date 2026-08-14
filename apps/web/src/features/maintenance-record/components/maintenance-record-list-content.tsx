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
import { useMaintenanceRecordList } from "../hooks/use-maintenance-record-list";
import { useHeader } from "@/shared/hooks/use-header";
import { ROUTES, vehicleListRoute } from "@/shared/constants/routes";
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

  // URLから絞り込み・並び替え・ページング条件を取得する
  // （vehicleId/ownerIdは遷移元から引き継ぐのみで、この画面から直接変更することはない）
  const vehicleId = searchParams.get("vehicleId") ?? undefined;
  const ownerId = searchParams.get("ownerId") ?? undefined;
  const maintenanceTypes = searchParams.getAll(
    "maintenanceType",
  ) as MaintenanceType[];
  const keywordParam = searchParams.get("keyword") ?? "";
  const sort =
    (searchParams.get("sort") as MaintenanceRecordSort | null) ??
    MAINTENANCE_RECORD_SORT.WORK_DATE_DESC;
  const page = Number(searchParams.get("page") ?? "1") || 1;
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

  // 検索バーの開閉状態（URLに既にkeywordが設定されている場合は開いた状態から始める）
  const [isSearchOpen, setIsSearchOpen] = useState(() => !!keywordParam);
  // 検索欄への入力途中の値（デバウンスでURLへコミットする前の値）
  const [keywordInput, setKeywordInput] = useState(keywordParam);

  /**
   * 現在のURLクエリパラメータを起点に、指定キーのみを更新したURLへ遷移する
   *
   * @param updates   更新するクエリパラメータ（値がnullの場合はキー自体を削除）
   * @param resetPage trueの場合、pageパラメータをリセットする（検索・フィルター・並び替え変更時）
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
  const title = data?.owner
    ? `${data.owner.userName} 様の整備履歴一覧`
    : "整備履歴一覧";

  // データ取得完了かつエラーが無い場合のみ、ヘッダーへ検索・追加アクションを表示する
  const showActions = !isPending && !isError && !!data;

  // ヘッダー右側アクションエリアの要素生成
  //
  // - 不必要なAppHeaderの再レンダリング防止のためuseMemoで保持
  // - 1文字入力ごとにactionsが再生成されると、日本語入力が途中で中断されて文字化けが発生するため、
  //   keywordInputはあえて依存配列に含めず、Inputは非制御で扱う（vehicle-list-content.tsxと同様の対応）
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

        <Link href={ROUTES.MAINTENANCE_NEW}>
          <Button type="button" size="sm" className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            履歴を追加
          </Button>
        </Link>
      </div>
    );
  }, [showActions, isSearchOpen, keywordParam, updateParams]);

  useHeader({ title, actions });

  /**
   * 「一覧へ戻る」押下時のハンドラー
   *
   * APIレスポンスのownerからオーナーIDを取得し、遷移元と同じ絞り込みの車両一覧へ戻る。
   * 自分自身の整備履歴を見ている場合（owner=null）は、通常の車両一覧へ戻る。
   */
  const handleBackToList = () => {
    router.push(vehicleListRoute(data?.owner?.id));
  };

  // データ取得中はスケルトンUIを表示
  if (isPending) {
    return <MaintenanceRecordListSkeleton />;
  }

  // データの取得に失敗した場合
  if (isError || !data) {
    return <ErrorState onRetry={refetch} />;
  }

  const records = data.records.content;
  const hasActiveFilter = !!keywordParam || maintenanceTypes.length > 0;

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

        {/* 並び替えプルダウン */}
        <Select
          value={sort}
          onValueChange={(value) => handleSortChange(value as MaintenanceRecordSort)}
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

      {/* 整備種別フィルター */}
      <MaintenanceTypeFilter selected={maintenanceTypes} onChange={handleTypeChange} />

      {records.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {hasActiveFilter
            ? "該当する整備履歴が見つかりません"
            : "登録されている整備履歴がありません"}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {records.map((record) => (
            <MaintenanceRecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {records.length > 0 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-muted-foreground">
            全{data.records.totalElements.toLocaleString()}件
          </p>
          <Pagination
            page={data.records.page}
            totalPages={data.records.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
