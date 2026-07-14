"use client";

import Image from "next/image";
import { Card, CardContent } from "@/shared/ui/card";

/**
 * Props型定義
 */
interface AuthLayoutProps {
  /** フォームなどのメインコンテンツ */
  children: React.ReactNode;
  /** 画面中央に表示するタイトル */
  title: string;
  /** タイトルの下に表示する補足説明文 */
  description: string;
}

/**
 * 認証画面（ログイン・新規登録など）の共通レイアウトコンポーネント
 *
 * @component
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <Card className="w-full max-w-md bg-card border-border shadow-[0_0_40px_-10px] shadow-primary/20">
      <CardContent className="pt-8 pb-6 px-6 sm:px-8">
        {/* ロゴ・タイトルエリア */}
        <div className="flex flex-col items-center mb-6">
          {/* アプリケーションロゴイメージ */}
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4 border border-border">
            <Image
              src="/icon.png"
              alt="Pitvia Logo"
              width={64}
              height={64}
              className="object-contain rounded-2xl"
            />
          </div>
          {/* グラデーションを適用したメインタイトル */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            {title}
          </h1>
          {/* サブテキスト（説明文） */}
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* フォーム等の子要素コンテンツをレンダリング */}
        {children}
      </CardContent>
    </Card>
  );
}
