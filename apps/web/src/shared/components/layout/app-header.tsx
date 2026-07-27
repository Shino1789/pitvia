"use client";

import { Menu } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useHeaderContext } from "@/shared/hooks/use-header";

/**
 * AppHeader コンポーネントの Props 型定義
 */
interface AppHeaderProps {
  /** モバイルメニュー（サイドバー）を開くためのコールバック関数 */
  onMenuClick: () => void;
}

/**
 * アプリケーション共通のヘッダーコンポーネント
 *
 * @component
 * @param props.onMenuClick ハンバーガーメニュー押下時のハンドラー
 */
export function AppHeader({ onMenuClick }: AppHeaderProps) {
  // useHeaderContext 経由で各ページから動的に設定されたタイトルとアクションボタンを取得
  const { title, actions } = useHeaderContext();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border bg-card/95 backdrop-blur">
      {/* 左側エリア：ハンバーガーメニューボタン ＆ ページタイトル */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* サイドバー開閉ボタン */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-foreground shrink-0"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* ページタイトルの動的表示 */}
        {title && (
          <h1 className="font-semibold text-lg text-foreground truncate">
            {title}
          </h1>
        )}
      </div>

      {/* 右側エリア：ページ固有のアクションボタン群（検索・追加等） */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
