"use client";

import { useQuery } from "@tanstack/react-query";
import { shopQueries } from "../queries/shop-queries";

/**
 * 現在有効な招待コードを取得・管理するカスタムフック
 *
 * @param enabled クエリを実行するかどうか（招待コード発行モーダルを開いている間のみ取得する）
 * @returns React Queryのクエリ結果オブジェクト (data, isPending, isError, refetch等)
 */
export function useInviteCode(enabled: boolean) {
  return useQuery({
    ...shopQueries.inviteCode(),
    enabled,
  });
}
