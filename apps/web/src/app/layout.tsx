import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/shared/ui/sonner";
import "./globals.css";

/**
 * アプリケーション共通メタ情報
 */
export const metadata: Metadata = {
  title: "Pitvia",
  description: "整備記録共有アプリ",
};

/**
 * アプリケーション共通レイアウト
 *
 * @component
 * @param props.children 子コンポーネント
 * @returns アプリケーションのルート構造を表すJSX
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {/* React Query の Context をアプリ全体に提供 */}
        <QueryProvider>
          {/* メインコンテンツ */}
          {children}

          {/* アプリ共通トースト表示 */}
          <Toaster richColors position="top-right" closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
