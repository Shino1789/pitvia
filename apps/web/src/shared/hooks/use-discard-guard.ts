"use client";

import { useRef, useState } from "react";

/**
 * フォームの未保存の変更を破棄する前に確認を挟むためのカスタムフック
 *
 * キャンセルボタンや閲覧モードへの切り替え等、複数の操作から共通で利用する想定。
 * 車両登録・編集に限らず、整備履歴やショップ情報など他Featureからも再利用するため
 * `shared/hooks`に配置している（特定Featureの下に置くと、他Featureがそこへ依存する形になってしまうため）。
 *
 * @returns 確認ダイアログの開閉状態と、ガード付きで操作を実行するための関数群
 */
export function useDiscardGuard() {
  // 確認ダイアログの表示状態を管理するstate
  const [isOpen, setIsOpen] = useState(false);
  // 確認後に実行する保留中の操作を保持する参照
  const pendingActionRef = useRef<(() => void) | null>(null);

  /**
   * 未保存の変更がある場合のみ確認ダイアログを挟んで操作を実行する
   *
   * @param isDirty 現在フォームに未保存の変更があるかどうか
   * @param action  実行したい操作
   */
  const guard = (isDirty: boolean, action: () => void) => {
    if (isDirty) {
      pendingActionRef.current = action;
      setIsOpen(true);
      return;
    }
    action();
  };

  /**
   * 確認ダイアログで「実行する」が選択された際に、保留中の操作を実行する
   *
   * 保留中の操作を取り出してからダイアログを閉じ、その後に実行する。
   * 先に参照を消してから実行することで、実行中の処理が再度この関数を誘発しても
   * 同じ操作が二重に実行されないようにしている。
   */
  const confirm = () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setIsOpen(false);

    action?.();
  };

  /**
   * 確認ダイアログで「キャンセル」が選択された、またはEsc等で閉じられた際の処理
   *
   * 保留中の操作を破棄してダイアログを閉じる。
   */
  const cancel = () => {
    pendingActionRef.current = null;
    setIsOpen(false);
  };

  // isOpenの直接的な書き換え（setIsOpen）は公開せず、cancel/confirmのみを公開することで
  // 「ダイアログを閉じる際は必ず保留中の操作も破棄される」という不変条件を呼び出し側に漏らさない
  return { isOpen, guard, confirm, cancel };
}
