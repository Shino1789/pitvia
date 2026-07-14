import type { Metadata } from "next";
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
        {/* メインコンテンツ */}
        {children}

        {/*
          アプリケーション共通のトースト表示コンポーネント
          richColors: 成功(緑)/エラー(赤)などのカラーリングを有効化
          position: 画面右上に出現
          closeButton: ユーザーが手動で閉じられる×ボタンを付与
         */}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
