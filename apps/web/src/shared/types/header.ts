import type { ReactNode } from "react";

/**
 * ヘッダーに描画するタイトルと右側アクションエリアの型定義
 */
export interface HeaderState {
  /** 画面タイトル（例: "ホーム", "車両一覧"） */
  readonly title: string;
  /** ヘッダー右側に配置する動的コンポーネント群 */
  readonly actions?: ReactNode;
}

/**
 * ヘッダー状態を更新するための操作関数群の型定義
 */
export interface HeaderDispatch {
  /** ヘッダーの状態を更新する */
  readonly setHeader: (state: HeaderState) => void;
  /** ヘッダーの状態をクリアする */
  readonly clearHeader: () => void;
}
