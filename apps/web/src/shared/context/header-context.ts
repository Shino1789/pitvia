import { createContext } from "react";
import type { HeaderState, HeaderDispatch } from "@/shared/types/header";

/**
 * アプリ共通ヘッダー（AppHeader）の表示状態（title, actions）を共有するためのコンテキスト
 */
export const HeaderStateContext = createContext<HeaderState | undefined>(
  undefined,
);

/**
 * アプリ共通ヘッダーの状態を更新するための操作関数（setHeader/clearHeader）を共有するコンテキスト
 */
export const HeaderDispatchContext = createContext<HeaderDispatch | undefined>(
  undefined,
);
