"use client";

import { forwardRef } from "react";
import { Input } from "@/shared/ui/input";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
}

/**
 * パスワード入力フィールドコンポーネント
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { id = "password", placeholder = "••••••••", ...props },
    ref, // React Hook Form から渡されてくる ref をキャッチ
  ) => {
    return (
      <Input
        id={id}
        type="password"
        placeholder={placeholder}
        className="bg-input border-border"
        ref={ref} // 実際の input 要素に ref をバインド
        {...props}
      />
    );
  },
);

// デバッグや開発者ツールでコンポーネント名が正しく表示されるように displayName を設定
PasswordInput.displayName = "PasswordInput";
