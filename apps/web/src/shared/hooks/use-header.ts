"use client";

import { useContext, useEffect } from "react";
import { HeaderContext } from "@/shared/context/header-context";
import type { HeaderState } from "@/shared/types/header";

/**
 * AppHeader のタイトルおよび右側のアクションボタン群を登録・更新するためのカスタムフック
 *
 * @param initialState 画面読み込み時に設定するヘッダーの初期状態（タイトル・アクション）
 * @returns ヘッダーの状態を動的に更新・クリアするためのハンドラー関数群
 */
export function useHeader(initialState?: HeaderState) {
  // コンテキストからヘッダー情報および操作関数を取得
  const context = useContext(HeaderContext);

  // HeaderProvider 外で呼び出された場合はエラーをスロー
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }

  const { setHeader, clearHeader } = context;

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
  return { setHeader, clearHeader };
}

/**
 * AppHeader コンポーネント内部で現在のヘッダー表示状態を参照するためのカスタムフック
 *
 * @returns 現在設定されているヘッダーの表示状態（title, actions）
 */
export function useHeaderContext() {
  // コンテキストから現在のヘッダー情報を取得
  const context = useContext(HeaderContext);

  // HeaderProvider 外で呼び出された場合はエラーをスロー
  if (!context) {
    throw new Error("useHeaderContext must be used within a HeaderProvider");
  }

  // 表示に必要なヘッダーの状態（title, actions）のみを返す
  return context.headerState;
}
