"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Pagination } from "@/shared/ui/pagination";
import { ErrorState } from "@/shared/components/state/error-state";
import { SearchBar } from "@/shared/components/search-bar";
import { CustomerListSkeleton } from "./customer-list-skeleton";
import { CustomerCard } from "./customer-card";
import { InviteCodeModal } from "@/features/shop/components/invite-code-modal";
import { useCustomerList } from "../hooks/use-customer-list";
import { useHeader } from "@/shared/hooks/use-header";
import { useQueryParams } from "@/shared/hooks/use-query-params";

/** 1ページあたりの表示件数（現状は固定。件数選択UIは今回のスコープ外） */
const DEFAULT_PAGE_SIZE = 20;

/**
 * 顧客一覧画面表示用メインコンテンツコンポーネント
 *
 * SHOPロール専用。ログインショップと連携中の顧客（オーナー）を一覧表示する。
 *
 * @component
 * @returns 顧客一覧コンテンツのJSX要素
 */
export function CustomerListContent() {
  const { searchParams, updateParams } = useQueryParams();

  // 検索キーワードをURLクエリパラメータから取得
  const keywordParam = searchParams.get("keyword") ?? "";
  // 現在のページ番号をURLクエリパラメータから取得
  const page = Number(searchParams.get("page") ?? "1") || 1;

  // APIから顧客一覧データを取得
  const { data, isPending, isError, refetch } = useCustomerList({
    keyword: keywordParam || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
  });

  // 検索欄への入力途中の値（デバウンスでURLへコミットする前の値）
  const [keywordInput, setKeywordInput] = useState(keywordParam);
  // 招待コード発行モーダルの表示状態
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // キーワード入力のデバウンス。入力が一定時間止まったらURLへ反映し、pageを1へリセットする
  useEffect(() => {
    const trimmed = keywordInput.trim();

    // 入力値がURLパラメータと同じ場合は何もしない
    if (trimmed === keywordParam) {
      return;
    }

    // 400ms後にURLパラメータを更新するタイマーをセット
    const timer = setTimeout(() => {
      updateParams({ keyword: trimmed || null }, true);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keywordInputの変化のみで発火させるため意図的に除外
  }, [keywordInput]);

  /**
   * ページ変更時のハンドラー（検索条件は維持する）
   *
   * @param next 変更後のページ番号
   */
  const handlePageChange = (next: number) => {
    updateParams({ page: next === 1 ? null : String(next) }, false);
  };

  // データ取得完了かつエラーが無い場合のみ、ヘッダーへ検索・招待コード発行ボタンを表示する
  const showActions = !isPending && !isError && !!data;

  // ヘッダー右側に表示する検索・招待コード発行ボタン群（keywordInputは依存配列に含めず、
  // 日本語入力中の再生成による文字化けを防ぐ。vehicle-list-content.tsxと同様の対応）
  const actions = useMemo(() => {
    if (!showActions) {
      return undefined;
    }

    return (
      <div className="flex items-center gap-2">
        <SearchBar
          defaultOpen={!!keywordParam}
          defaultValue={keywordParam}
          placeholder="顧客名で検索"
          onChange={setKeywordInput}
          onClear={() => {
            setKeywordInput("");
            updateParams({ keyword: null }, true);
          }}
        />

        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          招待コード発行
        </Button>
      </div>
    );
  }, [showActions, keywordParam, updateParams]);

  useHeader({ title: "顧客一覧", actions });

  // データ取得中はスケルトンUIを表示
  if (isPending) {
    return <CustomerListSkeleton />;
  }

  // データの取得に失敗した場合
  if (isError || !data) {
    return <ErrorState onRetry={refetch} />;
  }

  const customers = data.content;
  const hasActiveFilter = !!keywordParam;

  return (
    <div className="space-y-4">
      {customers.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {hasActiveFilter
            ? "該当する顧客が見つかりません"
            : "連携中の顧客がいません"}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {customers.map((customer) => (
            <CustomerCard key={customer.ownerId} customer={customer} />
          ))}
        </div>
      )}

      {/* ページング */}
      {customers.length > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={handlePageChange}
          className="pt-2"
        />
      )}

      {/* 招待コード発行モーダル */}
      <InviteCodeModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
    </div>
  );
}
