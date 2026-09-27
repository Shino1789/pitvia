"use client";

import { useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

/**
 * Props型定義
 */
interface SearchBarProps {
  /**
   * 検索キーワードの初期値（uncontrolled）
   *
   * URLに既に検索条件がある場合の初期表示等に使用する。入力中の値はDOM（非制御Input）が
   * 保持し、Reactのstateとしては持たない（IME入力中の再レンダリングによる文字化けを
   * 避けるための、既存の一覧画面と同じ設計）。
   */
  defaultValue?: string;
  /** 入力値変更時のコールバック（値の保持・デバウンス・URL反映等は呼び出し側の責務） */
  onChange: (value: string) => void;
  /** 検索欄を閉じた（×ボタン押下）際のコールバック */
  onClear: () => void;
  /** placeholder文言（検索アイコンのaria-labelにも使用する） */
  placeholder: string;
  /** 初期状態で展開しておくかどうか（URLに既に検索条件がある場合等。未指定時はfalse） */
  defaultOpen?: boolean;
}

/**
 * 一覧画面共通の「検索アイコン押下で展開する検索欄」UIコンポーネント
 *
 * @component
 */
export function SearchBar({
  defaultValue = "",
  onChange,
  onClear,
  placeholder,
  defaultOpen = false,
}: SearchBarProps) {
  // 検索欄の開閉状態（UI状態のみ。検索条件そのものはonChange/onClearで呼び出し側が管理する）
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={placeholder}
        onClick={() => setIsOpen(true)}
      >
        <SearchIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-36 sm:w-56"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label="検索を閉じる"
        onClick={() => {
          setIsOpen(false);
          onClear();
        }}
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
