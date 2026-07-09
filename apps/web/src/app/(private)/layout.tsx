// apps/web/src/app/(private)/layout.tsx
"use client";

import { AuthProvider } from "@/providers/auth-provider";

/**
 * 認証必須（プライベート）ルート共通のレイアウトコンポーネント
 *
 * 配下のページへのアクセス時、メモリ上に認証情報がなければ
 * AuthProvider を通じてアプリ起動時・リロード時にセッションの復元を試みる。
 *
 * @param props.children 子コンポーネント
 * @returns 認証プロバイダーでラップされた子コンポーネントのJSX
 */
export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthProvider>{children}</AuthProvider>;
}
