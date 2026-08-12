import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // ベースのレイアウトと文字・プレースホルダー装飾（input.tsxと統一）
        "placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground w-full min-w-0 resize-none rounded-md border px-3 py-2 text-base shadow-xs outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // 背景と枠線の色を Pitvia のフォームデザイン（bg-input / border-border）に統合
        "bg-input border-border transition-all duration-200",
        // フォーカス時のリング・枠線の発色を ring-primary に適正化
        "focus-visible:border-border focus-visible:ring-primary focus-visible:ring-[3px]",
        // バリデーションエラー（aria-invalid）の際のアニメーション・赤いシャドウの吸い付きを完全内包
        "aria-invalid:border-destructive/80 aria-invalid:ring-destructive/50 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:shadow-[0_0_15px_-2px_rgba(239,68,68,0.6)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
