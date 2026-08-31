"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import {
  HeaderStateContext,
  HeaderDispatchContext,
} from "@/shared/context/header-context";
import type { HeaderState, HeaderDispatch } from "@/shared/types/header";

/** ヘッダー未設定時（初期状態）の定数 */
const EMPTY_HEADER: HeaderState = {
  title: "",
};

/**
 * アプリケーション共通ヘッダーの状態を配下コンポーネント全体で共有・管理するプロバイダーコンポーネント
 *
 * headerState（表示状態）とdispatch（setHeader/clearHeader）を別々のコンテキストで提供する。
 * 両者を1つのコンテキストにまとめてしまうと、setHeaderを呼ぶ側（各画面のuseHeader()）が
 * headerStateの変化も同時に購読してしまい、「自身の書き込みで自身が再レンダリングされ、
 * actionsが再生成されて再度書き込みが発生する」循環的な再レンダリングを引き起こすため、
 * 意図的に分離している。
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

  // dispatchはsetHeader/clearHeaderの参照が不変なため、headerStateが変化しても
  // 再生成されない（= useHeader()側の再レンダリングを引き起こさない）
  const dispatch: HeaderDispatch = useMemo(
    () => ({ setHeader, clearHeader }),
    [setHeader, clearHeader],
  );

  return (
    <HeaderDispatchContext.Provider value={dispatch}>
      <HeaderStateContext.Provider value={headerState}>
        {children}
      </HeaderStateContext.Provider>
    </HeaderDispatchContext.Provider>
  );
}
