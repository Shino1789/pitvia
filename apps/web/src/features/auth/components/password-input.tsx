"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { cn } from "@/lib/utils";

/**
 * Props型定義
 */
type PasswordInputProps = React.ComponentProps<typeof Input> & {
  /**
   * パスワードの表示/非表示切り替えトグルボタンを表示するかどうか
   * @default true
   */
  showToggle?: boolean;
};

/**
 * パスワード入力フィールドコンポーネント
 *
 * @component
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { placeholder = "••••••••", className, showToggle = true, ...props },
    ref,
  ) => {
    // パスワードの表示/非表示を管理するステート
    const [showPassword, setShowPassword] = useState(false);

    /**
     * 表示切り替えボタンのクリックハンドラー
     */
    const handleToggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="relative w-full">
        <Input
          // ステートに応じて type を "password" または "text" に動的切り替え
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          // トグル表示時のみ、アイコンと重ならないよう右側に適切なパディング（pr-10）を確保
          className={cn(showToggle && "pr-10", className)}
          ref={ref}
          {...props}
        />

        {showToggle && (
          <button
            type="button"
            onClick={handleToggleVisibility}
            // クリック時に input からフォーカスが外れてテキストカーソル（キャレット）が消えるのを防ぐ
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer p-0.5 rounded-sm outline-none",
              // shadcn/ui のデザインシステムと合わせて focus-visible:ring に統一
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            )}
            aria-label={
              showPassword ? "パスワードを非表示にする" : "パスワードを表示する"
            }
          >
            {/* パスワードの現在の表示状態に合わせて直感的なアイコンを表示 */}
            {showPassword ? (
              <Eye className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    );
  },
);

// デバッグや開発者ツールでコンポーネント名が正しく表示されるように displayName を設定
PasswordInput.displayName = "PasswordInput";
