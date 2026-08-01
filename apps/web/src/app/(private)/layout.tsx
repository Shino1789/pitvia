"use client";

import { useState } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { HeaderProvider } from "@/shared/providers/header-provider";
import { AppHeader } from "@/shared/components/layout/app-header";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";

/**
 * 認証必須（プライベート）ルート共通のレイアウトコンポーネント
 *
 * 配下のページへのアクセス時、メモリ上に認証情報がなければ
 * AuthProvider を通じてアプリ起動時・リロード時にセッションの復元を試みる。
 *
 * @component
 * @param props.children 子コンポーネント
 * @returns 認証・ヘッダープロバイダーおよび共通レイアウト（Header, Sidebar, Content）のJSX
 */
export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // サイドバーの開閉状態を管理
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <HeaderProvider>
        <div className="min-h-screen bg-background flex flex-col">
          {/* 全プライベート画面共通のヘッダー */}
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* サイドバー */}
          <AppSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* 各ページのコンテンツ表示領域 */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </HeaderProvider>
    </AuthProvider>
  );
}
