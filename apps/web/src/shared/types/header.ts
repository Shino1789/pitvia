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

export interface HeaderContextType {
  readonly headerState: HeaderState;
  readonly setHeader: (state: HeaderState) => void;
  readonly clearHeader: () => void;
}
