"use client";

import { useSearchParams } from "next/navigation";

/**
 * URLの`returnTo`クエリパラメータから、遷移元の画面へ戻るためのパスを取得するカスタムフック
 *
 * @param fallback `returnTo`が未指定の場合（直接URLアクセス等）に使うフォールバック先
 * @returns 戻り先のパス（クエリパラメータ込み）
 */
export function useReturnTo(fallback: string): string {
  const searchParams = useSearchParams();
  return searchParams.get("returnTo") ?? fallback;
}
