import type { Metadata } from "next";
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
 * @param props.children 子コンポーネント
 * @returns 子コンポーネントのJSX
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
