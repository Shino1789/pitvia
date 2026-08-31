"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { ErrorPage } from "@/shared/components/error/error-page";
import { Button } from "@/shared/ui/button";

/**
 * 予期せぬ実行時エラー（500系）のバウンダリ画面コンポーネント
 *
 * @component
 * @returns 500 エラーページのJSX要素
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: 本番環境運用時は Sentry / Datadog 等の外部エラー監視プロバイダーへログを転送する
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      code="500"
      title="SERVER ERROR"
      description={`サーバーエラーが発生しました。
                    時間をおいて再度お試しください。`}
      secondaryAction={
        <Button
          variant="outline"
          onClick={reset}
          className="w-full gap-2 border-border bg-secondary/40 text-foreground hover:bg-secondary sm:w-auto"
        >
          <RotateCw className="h-4 w-4" />
          再試行
        </Button>
      }
    />
  );
}
