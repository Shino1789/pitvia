"use client";

import Link from "next/link";
import { LogOut, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import { useSidebar } from "@/shared/hooks/use-sidebar";

/**
 * AppSidebar コンポーネントの Props 型定義
 */
interface AppSidebarProps {
  /** サイドバーの開閉状態 */
  open: boolean;
  /** サイドバーを閉じるためのコールバック関数 */
  onClose: () => void;
}

/**
 * サイドバーナビゲーションコンポーネント
 *
 * @component
 * @param props.open サイドバーの表示フラグ
 * @param props.onClose ドロワーを閉じるためのハンドラー関数
 */
export function AppSidebar({ open, onClose }: AppSidebarProps) {
  // useSidebar カスタムフックから表示・操作に必要なデータとハンドラーを取得
  const { user, userInitial, menuItems, isPathActive, handleLogout } =
    useSidebar(onClose);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="left"
        className="w-72 bg-card border-border p-0 [&>button]:hidden"
      >
        {/* スクリーンリーダー（アクセシビリティ）用の隠しタイトル */}
        <SheetTitle className="sr-only">ナビゲーションメニュー</SheetTitle>

        <div className="flex flex-col h-full">
          {/* サイドバー ヘッダー領域（アプリロゴ ＆ 閉じるボタン） */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border">
            {/* アプリ名 */}
            <div className="flex items-center pl-2">
              <span className="font-semibold text-lg text-foreground tracking-tight">
                Pitvia
              </span>
            </div>

            {/* ドロワーを閉じるボタン */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              aria-label="メニューを閉じる"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* ナビゲーションメニューリスト領域 */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                // 現在表示中のパスに基づいてアクティブ状態を判定
                const isActive = isPathActive(item.path);

                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* フッター領域：ログインユーザー情報 ＆ ログアウトボタン */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              {/* ユーザーアバター・名前・メールアドレス */}
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-10 w-10 bg-primary shrink-0">
                  {/* Radix UI の機能で画像読み込み失敗時に自動で Fallback を表示 */}
                  <AvatarImage
                    src={user?.iconUrl ?? undefined}
                    alt={user?.userName ?? "ユーザー"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="font-medium text-foreground truncate">
                    {user?.userName ?? "ゲスト"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>

              {/* ログアウト実行ボタン */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                title="ログアウト"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
