import { createContext } from "react";
import type { HeaderContextType } from "@/shared/types/header";

/**
 * アプリ共通ヘッダー（AppHeader）の状態および操作用ハンドラーを共有するためのコンテキスト
 */
export const HeaderContext = createContext<HeaderContextType | undefined>(
  undefined,
);
