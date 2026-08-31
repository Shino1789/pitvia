"use client";

import { useContext, useEffect } from "react";
import {
  HeaderStateContext,
  HeaderDispatchContext,
} from "@/shared/context/header-context";
import type { HeaderState } from "@/shared/types/header";

/**
 * ヘッダーのタイトルおよび右側のアクションボタン群を登録・更新するためのカスタムフック
 *
 * @param initialState 画面読み込み時に設定するヘッダーの初期状態（タイトル・アクション）
 * @returns ヘッダーの状態を動的に更新・クリアするためのハンドラー関数群
 */
export function useHeader(initialState?: HeaderState) {
  // コンテキストから操作関数（setHeader/clearHeader）のみを取得
  const dispatch = useContext(HeaderDispatchContext);

  // HeaderProvider 外で呼び出された場合はエラーをスロー
  if (!dispatch) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }

  const { setHeader, clearHeader } = dispatch;

  // 初期状態からタイトルとアクションを抽出
  const title = initialState?.title;
  const actions = initialState?.actions;

  // 画面のマウント時・引数の変化時にヘッダー状態を更新し、アンマウント時にクリアする
  useEffect(() => {
    setHeader({
      title: title ?? "",
      actions,
    });

    // コンポーネントのアンマウント時にヘッダーを初期状態にリセット
    return () => {
      clearHeader();
    };
  }, [title, actions, setHeader, clearHeader]);

  // 画面側でイベントに応じて個別にヘッダーを更新・クリアしたい場合のために操作関数を返す
  return dispatch;
}

/**
 * AppHeader コンポーネント内部で現在のヘッダー表示状態を参照するためのカスタムフック
 *
 * HeaderStateContext（ヘッダーの表示状態）を購読する。AppHeader専用。
 *
 * @returns 現在設定されているヘッダーの表示状態（title, actions）
 */
export function useHeaderContext() {
  // コンテキストから現在のヘッダー情報を取得
  const state = useContext(HeaderStateContext);

  // HeaderProvider 外で呼び出された場合はエラーをスロー
  if (!state) {
    throw new Error("useHeaderContext must be used within a HeaderProvider");
  }

  return state;
}
