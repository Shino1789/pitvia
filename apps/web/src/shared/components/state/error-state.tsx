import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/lib/utils";

/**
 * Props型定義
 */
export interface ErrorStateProps {
  /** エラータイトルのオーバーライド */
  title?: string;
  /** エラーの補足説明メッセージ */
  description?: string;
  /** 再試行ボタン押下時のコールバック関数 */
  onRetry?: () => void;
  /** 再試行ボタンのラベル */
  retryLabel?: string;
  /** 外枠コンテナのカスタムクラス */
  className?: string;
}

/**
 * データ取得失敗時（APIエラー）用のインライン表示コンポーネント
 *
 * @component
 * @returns エラー表示のJSX要素
 */
export function ErrorState({
  title = "データの取得に失敗しました",
  description = "一時的な問題が発生している可能性があります。時間をおいて再度お試しください。",
  onRetry,
  retryLabel = "再試行",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-220px)] w-full items-center justify-center p-4 sm:p-6",
        className,
      )}
    >
      <Card className="w-full max-w-md border-dashed border-border bg-card/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
          {/* アイコン領域 */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>

          {/* テキスト領域 */}
          <div className="space-y-2 max-w-xs sm:max-w-sm">
            <h3 className="text-base font-semibold tracking-tight text-foreground text-balance">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line text-balance [word-break:keep-all]">
              {description}
            </p>
          </div>

          {/* 再試行ボタン */}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-6 gap-2 border-border bg-background hover:bg-accent hover:text-accent-foreground w-full sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {retryLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
