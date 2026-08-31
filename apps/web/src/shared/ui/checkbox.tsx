"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // ベースレイアウト & アニメーション
        "peer size-4 shrink-0 rounded border-2 outline-none transition-all duration-200",
        // 通常状態（未チェック時はダークテーマに馴染む透過背景と枠線）
        "border-zinc-500 bg-transparent hover:border-primary",
        // チェック状態
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
        // フォーカス状態
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
        // バリデーションエラー状態
        "aria-invalid:border-destructive/80 aria-invalid:ring-destructive/50 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:shadow-[0_0_12px_-2px_rgba(239,68,68,0.6)]",
        // エラー時のホバー状態（通常ホバーの primary 色による上書きを防止し、赤色の発光を強調）
        "aria-invalid:hover:border-destructive aria-invalid:hover:shadow-[0_0_15px_-1px_rgba(239,68,68,0.8)]",
        // 無効化状態
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
