"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Pagination } from "@/shared/ui/pagination";
import { ErrorState } from "@/shared/components/state/error-state";
import { CustomerListSkeleton } from "./customer-list-skeleton";
import { CustomerCard } from "./customer-card";
import { InviteCodeModal } from "@/features/shop/components/invite-code-modal";
import { useCustomerList } from "../hooks/use-customer-list";
import { useHeader } from "@/shared/hooks/use-header";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 検索キーワード（URL上の確定値）
  const keywordParam = searchParams.get("keyword") ?? "";
  // 現在のページ番号
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const { data, isPending, isError, refetch } = useCustomerList({
    keyword: keywordParam || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
  });

  // 検索バーの開閉状態（URLに既にkeywordが設定されている場合は開いた状態から始める）
  const [isSearchOpen, setIsSearchOpen] = useState(() => !!keywordParam);
  // 検索欄への入力途中の値（デバウンスでURLへコミットする前の値）
  const [keywordInput, setKeywordInput] = useState(keywordParam);
  // 招待コード発行モーダルの表示状態
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  /**
   * 現在のURLクエリパラメータを起点に、指定キーのみを更新したURLへ遷移する
   *
   * @param updates   更新するクエリパラメータ（値がnullの場合はキー自体を削除）
   * @param resetPage trueの場合、pageパラメータをリセットする
   */
  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage: boolean) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          next.delete(key);
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
        {isSearchOpen ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              defaultValue={keywordParam}
              placeholder="顧客名で検索"
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
            aria-label="顧客名で検索"
            onClick={() => setIsSearchOpen(true)}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        )}

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
  }, [showActions, isSearchOpen, keywordParam, updateParams]);

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
