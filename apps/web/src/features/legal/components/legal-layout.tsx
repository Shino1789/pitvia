import type React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

/**
 * 法的ドキュメント（規約など）のセクション構造の型定義
 */
interface LegalSection {
  /** セクションの識別子（アンカーリンクのIDとして使用） */
  id: string;
  /** セクションの見出し文字列 */
  heading: string;
}

/**
 * LegalLayout コンポーネントのプロップス定義
 */
interface LegalLayoutProps {
  /** ページのメインタイトル（例: 「利用規約」） */
  title: string;
  /** タイトルの下に表示するリード文・前文 */
  subtitle: string;
  /** 目次を生成するためのセクション配列 */
  sections: LegalSection[];
  /** 各セクションの実コンテンツ（LegalSectionBlockの並び） */
  children: React.ReactNode;
}

/**
 * 法的ドキュメント（利用規約・プライバシーポリシーなど）の共通レイアウトコンポーネント
 *
 * @component
 * @returns 2カラム構成（サイドバー目次 + メインコンテンツ）のJSX要素
 */
export function LegalLayout({
  title,
  subtitle,
  sections,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* トップナビゲーションバー */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 新規登録画面への戻るリンク */}
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Link>
          {/* サービスロゴ */}
          <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-sm font-semibold tracking-wide text-transparent">
            Pitvia
          </span>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        {/* ドキュメントタイトルブロック */}
        <div className="mb-10 border-b border-border/60 pb-8 lg:mb-14">
          <h1 className="text-pretty text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {/* 2カラムレイアウト（PCサイズ以上で適用） */}
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* サイドバー：目次ナビゲーション */}
          <aside className="mb-10 lg:mb-0">
            <nav className="lg:sticky lg:top-20">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                目次
              </p>
              <ul className="space-y-1 border-l border-border/60">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      {index + 1}. {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* メイン文章エリア */}
          <main className="min-w-0">
            {/* 各規約セクションのレンダリング */}
            <article className="space-y-10 leading-relaxed">{children}</article>

            {/* お問い合わせに関する事前案内通知 */}
            <div className="mt-14 rounded-xl border border-border/60 bg-card/60 p-6">
              <h3 className="mb-2 text-base font-semibold">お問い合わせ</h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                本サービスに関するお問い合わせは、正式公開後に設置予定のお問い合わせフォームよりお願いいたします。
              </p>
            </div>

            {/* 最終更新日 */}
            <p className="mt-10 text-sm text-muted-foreground">
              最終更新日：2026年7月11日
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * LegalSectionBlock コンポーネントのプロップス定義
 */
interface LegalSectionBlockProps {
  /** セクションの識別子（目次からのアンカーリンク先ID） */
  id: string;
  /** セクションの通し番号（例: 1） */
  index: number;
  /** セクションの見出し文字列 */
  heading: string;
  /** セクション内の文章やリストなどのJSX要素 */
  children: React.ReactNode;
}

/**
 * ドキュメント内の各章（セクション）を構築するコンポーネント
 *
 * @component
 * @returns ゼロパディングされた章番号付き見出しとコンテンツのJSX要素
 */
export function LegalSectionBlock({
  id,
  index,
  heading,
  children,
}: LegalSectionBlockProps) {
  return (
    <section id={id} className="scroll-mt-20">
      {/* ナビゲーション等からスクロールした際にヘッダーと被らないよう scroll-mt を設定 */}
      <h2 className="mb-3 flex items-baseline gap-3 text-xl font-semibold tracking-tight">
        {/* 章番号を2桁のゼロパディング（01, 02...）でスタイリッシュに表示 */}
        <span className="text-base font-medium text-primary">
          {String(index).padStart(2, "0")}
        </span>
        {heading}
      </h2>
      <div className="space-y-3 text-pretty leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
