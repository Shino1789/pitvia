"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryParams } from "@/shared/hooks/use-query-params";

/** キーワード入力が止まってからURLへ反映するまでの待機時間（ms） */
const KEYWORD_DEBOUNCE_MS = 400;

/**
 * 一覧画面共通の「キーワード検索 → デバウンス → URLのkeyword更新 → pageを1へリセット」を担うフック
 *
 * @returns URL上の確定済みキーワード、入力値の更新関数（SearchBarのonChange用）、
 *          検索欄を閉じた際の解除関数（SearchBarのonClear用）
 */
export function useKeywordSearch() {
  const { searchParams, updateParams } = useQueryParams();

  // URL上の確定済みキーワード
  const keywordParam = searchParams.get("keyword") ?? "";
  // 検索欄への入力途中の値（デバウンスでURLへコミットする前の値）
  const [keywordInput, setKeywordInput] = useState(keywordParam);

  // 入力が一定時間止まったらURLへ反映し、pageを1へリセットする
  useEffect(() => {
    const trimmed = keywordInput.trim();

    // 入力値がURLパラメータと同じ場合は何もしない
    if (trimmed === keywordParam) {
      return;
    }

    const timer = setTimeout(() => {
      updateParams({ keyword: trimmed || null }, true);
    }, KEYWORD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // keywordInputの変化のみで発火させるため、keywordParam・updateParamsは意図的に依存から除外する。
    // 含めると、ブラウザの戻る・進むでURLのkeywordだけが変わった際に、古い入力値が再度URLへ
    // 書き戻されてしまう
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput]);

  /**
   * 検索欄を閉じた際に、入力値とURLのkeywordを解除する（pageは1へリセット）
   */
  const clearKeyword = useCallback(() => {
    setKeywordInput("");
    updateParams({ keyword: null }, true);
  }, [updateParams]);

  return { keywordParam, setKeywordInput, clearKeyword };
}
