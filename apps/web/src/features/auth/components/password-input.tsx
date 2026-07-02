"use client";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  label?: string;
}

export function PasswordInput({
  id = "password",
  label = "パスワード",
  placeholder = "••••••••",
  ...props
}: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type="password"
        placeholder={placeholder}
        className="bg-input border-border"
        {...props}
      />
    </div>
  );
}
