"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * URL Search Params（クエリパラメータ）を更新するための共通カスタムフック
 *
 * @returns {object} 現在のパス名、現在のURLパラメータ、およびパラメータ更新用関数
 */
export function useQueryParams() {
  // Next.jsのルーターを取得
  const router = useRouter();
  // 現在のページパスを取得（例: "/customers"）
  const pathname = usePathname();
  // 現在のURLクエリパラメータを取得（例: "?keyword=田中&page=2"）
  const searchParams = useSearchParams();

  /**
   * 現在のURLクエリパラメータをベースに、指定されたキーだけを更新してURLへ反映（画面遷移）する関数
   *
   * @param newParams - 更新したいキーと値のオブジェクト。値が null の場合はそのキーを削除する。
   *                  値が配列の場合は同名キーで複数の値を設定する。（例: ?type=A&type=B）。
   * @param resetPage - true の場合、pageパラメータを削除して1ページ目に戻す。
   */
  const updateParams = useCallback(
    (
      newParams: Record<string, string | string[] | null>,
      resetPage = false,
    ) => {
      // 読み取り専用の searchParams を直接操作可能な URLSearchParams オブジェクトに変換
      const next = new URLSearchParams(searchParams.toString());

      // 渡された newParams オブジェクトのキーと値を1つずつ処理
      Object.entries(newParams).forEach(([key, value]) => {
        // 更新対象のキーを一旦既存のパラメータから削除（重複防止）
        next.delete(key);

        // 値が null の場合は追加処理を行わず、削除した状態のまま終了する
        if (value === null) {
          return;
        }

        // 値が配列の場合は、同じキーに対して複数の値を追加する（例: ?type=A&type=B）
        if (Array.isArray(value)) {
          value.forEach((v) => next.append(key, v));
        } else {
          // 単一の文字列の場合は set で値を割り当てる
          next.set(key, value);
        }
      });

      if (resetPage) {
        next.delete("page");
      }

      // クエリパラメータを文字列化（例: "keyword=田中"）
      const query = next.toString();

      // 新しいURLを作成し、画面をリプレイスで遷移する
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    // router, pathname, searchParams のいずれかが変更された時のみ関数を再生成する
    [router, pathname, searchParams],
  );

  return { pathname, searchParams, updateParams };
}
