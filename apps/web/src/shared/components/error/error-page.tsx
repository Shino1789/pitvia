import type { ReactNode } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/constants/routes";

/**
 * エラー画面共通コンポーネントの型定義
 */
export type ErrorPageProps = {
  /** 表示するエラーコード（例: "404"） */
  code: string;
  /** 英語タイトル（例: "NOT FOUND"） */
  title: string;
  /** 説明文 */
  description: string;
  /** 追加のアクションボタン（例: 500の再試行ボタン） */
  secondaryAction?: ReactNode;
  /** プライマリボタンの遷移先（デフォルト: ROUTES.DASHBOARD） */
  homeHref?: string;
  /** プライマリボタンのラベル（デフォルト: "ダッシュボード画面に戻る"） */
  homeLabel?: string;
};

/**
 * エラー画面共通レイアウトコンポーネント
 *
 * @component
 */
export function ErrorPage({
  code,
  title,
  description,
  secondaryAction,
  homeHref = ROUTES.DASHBOARD,
  homeLabel = "ホームに戻る",
}: ErrorPageProps) {
  return (
    <main
      role="main"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center"
    >
      {/* 背景のグロー装飾 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* エラーコード（サイバーパンク/近未来デザインを表現するネオンテキストシャドウ） */}
        <p
          className="font-mono text-7xl font-bold leading-none tracking-tight text-foreground sm:text-8xl md:text-9xl"
          style={{
            textShadow:
              "0 0 20px oklch(0.75 0.15 190 / 0.7), 0 0 48px oklch(0.75 0.15 190 / 0.4)",
          }}
        >
          {code}
        </p>

        {/* 英語タイトル */}
        <div className="mt-5 flex flex-col items-center gap-2">
          <h1 className="font-mono text-sm font-semibold tracking-[0.4em] text-primary sm:text-base">
            {title}
          </h1>
          <span aria-hidden="true" className="h-px w-16 bg-primary/50" />
        </div>

        {/* 説明文（whitespace-pre-line で改行に対応） */}
        <p className="mt-6 whitespace-pre-line text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>

        {/* アクションボタン */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 font-semibold text-primary-foreground shadow-[0_0_20px_-4px] shadow-primary/50 transition-opacity hover:opacity-90 sm:w-auto"
          >
            <Link href={homeHref}>
              <House className="h-4 w-4" />
              {homeLabel}
            </Link>
          </Button>
          {secondaryAction}
        </div>
      </div>
    </main>
  );
}
