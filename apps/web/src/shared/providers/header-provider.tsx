"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { HeaderContext } from "@/shared/context/header-context";
import type { HeaderState, HeaderContextType } from "@/shared/types/header";

/** ヘッダー未設定時（初期状態）の定数 */
const EMPTY_HEADER: HeaderState = {
  title: "",
};

/**
 * アプリケーション共通ヘッダーの状態を配下コンポーネント全体で共有・管理するプロバイダーコンポーネント
 *
 * @component
 * @param props.children 子コンポーネント
 * @returns ヘッダーコンテキストでラップされた子コンポーネントのJSX
 */
export function HeaderProvider({ children }: { children: ReactNode }) {
  // アプリ共通ヘッダー（タイトルや右側アクションボタン群）の表示状態を保持するstate
  const [headerState, setHeaderState] = useState<HeaderState>(EMPTY_HEADER);

  // ヘッダーの状態を更新するハンドラー関数
  const setHeader = useCallback((state: HeaderState) => {
    setHeaderState(state);
  }, []);

  // ヘッダーの状態を初期状態にクリアするハンドラー関数
  const clearHeader = useCallback(() => {
    setHeaderState(EMPTY_HEADER);
  }, []);

  // valueをuseMemoでキャッシュし、親の再レンダリング時に参照が変わることによる子コンポーネントの不要な再描画を防止
  const value: HeaderContextType = useMemo(
    () => ({
      headerState,
      setHeader,
      clearHeader,
    }),
    [headerState, setHeader, clearHeader],
  );

  return (
    <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
  );
}
