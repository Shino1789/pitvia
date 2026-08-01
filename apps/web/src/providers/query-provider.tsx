"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * Props型定義
 */
interface QueryProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
}

/**
 * グローバル共有用 QueryClient インスタンス
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分間はデータを最新とみなし再取得しない
      gcTime: 5 * 60 * 1000, // 未使用データは5分後にメモリから破棄する
      retry: 1, // エラー発生時は1回だけ自動再試行
      refetchOnWindowFocus: false, // ブラウザのタブ切り替え時の自動再取得を無効化
    },
  },
});

/**
 * React Query (TanStack Query) のグローバルプロバイダーコンポーネント
 *
 * アプリケーション全体で共有するデータ取得・キャッシュの基本オプションの設定および
 * 開発用デバッグツール（DevTools）の提供を担当する。
 *
 * @component
 * @param props.children 子コンポーネント
 * @returns QueryClientProvider および開発環境用 DevTools を含むJSX
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* 開発環境でのみデバッグ用モニターを表示 */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
