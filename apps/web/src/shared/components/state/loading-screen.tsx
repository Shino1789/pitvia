import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props型定義
 */
export interface LoadingScreenProps {
  /** ローディングアイコンの下に表示するメッセージ */
  message?: string;
  /** コンテナのカスタムクラス */
  className?: string;
}

/**
 * 共通ローディングスクリーン
 *
 * @component
 * @returns ローディングのJSX要素
 */
export function LoadingScreen({
  message = "しばらくお待ちください...",
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col items-center justify-center gap-3 bg-background text-foreground",
        className,
      )}
    >
      {/* メインローディングインジケーター */}
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-lg font-semibold tracking-wider">
          読み込み中...
        </span>
      </div>
      {/* サブメッセージ */}
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
