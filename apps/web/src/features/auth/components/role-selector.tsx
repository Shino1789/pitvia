"use client";

import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Label } from "@/shared/ui/label";
import { UserRole } from "@/shared/constants/role";

/**
 * Props型定義
 */
interface RoleSelectorProps {
  /** 現在選択されているユーザーロールの値 */
  value: UserRole;
  /** ロールが変更された際に呼び出されるイベントハンドラー */
  onChange: (value: UserRole) => void;
}

/**
 * アカウント登録時のユーザー種別を選択するラジオグループコンポーネント
 *
 * @component
 */
export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      {/* フィールドのラベル */}
      <Label className="text-sm">アカウント種別</Label>

      {/* ラジオグループのコンテナ */}
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as UserRole)}
        className="gap-2"
      >
        {/* オーナー（車両所有者）選択オプション */}
        <label
          htmlFor="type-owner"
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
            value === "OWNER"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          }`}
        >
          <RadioGroupItem value="OWNER" id="type-owner" />
          <span className="text-sm">オーナー（車両所有者）</span>
        </label>

        {/* 整備ショップ選択オプション */}
        <label
          htmlFor="type-shop"
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
            value === "SHOP"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          }`}
        >
          <RadioGroupItem value="SHOP" id="type-shop" />
          <span className="text-sm">整備ショップ</span>
        </label>
      </RadioGroup>
    </div>
  );
}
