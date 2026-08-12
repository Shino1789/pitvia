import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { useDiscardGuard } from "./use-discard-guard";

/**
 * useDiscardGuard カスタムフックの単体テスト
 */
describe("useDiscardGuard", () => {
  /**
   * @test 未保存の変更が無い場合、確認ダイアログを開かずactionが即座に実行されることを確認
   */
  test("isDirty=falseの場合はダイアログを開かずactionを即実行する", () => {
    const { result } = renderHook(() => useDiscardGuard());
    const action = vi.fn();

    act(() => {
      result.current.guard(false, action);
    });

    expect(result.current.isOpen).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 未保存の変更がある場合、actionを保留してダイアログを開き、その場ではactionを実行しないことを確認
   */
  test("isDirty=trueの場合はダイアログを開き、actionはその場では実行しない", () => {
    const { result } = renderHook(() => useDiscardGuard());
    const action = vi.fn();

    act(() => {
      result.current.guard(true, action);
    });

    expect(result.current.isOpen).toBe(true);
    expect(action).not.toHaveBeenCalled();
  });

  /**
   * @test confirm()実行時、ダイアログが閉じ、保留していたactionが1回だけ実行されることを確認
   */
  test("confirm()で保留していたactionが1回だけ実行され、ダイアログが閉じる", () => {
    const { result } = renderHook(() => useDiscardGuard());
    const action = vi.fn();

    act(() => {
      result.current.guard(true, action);
    });

    act(() => {
      result.current.confirm();
    });

    expect(result.current.isOpen).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  /**
   * @test cancel()実行時、ダイアログが閉じ、保留していたactionが実行されないことを確認
   */
  test("cancel()では保留していたactionが実行されず、ダイアログが閉じる", () => {
    const { result } = renderHook(() => useDiscardGuard());
    const action = vi.fn();

    act(() => {
      result.current.guard(true, action);
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isOpen).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  /**
   * @test confirm()後に再度confirm()を呼んでも、保留アクションが既にクリアされているため二重実行されないことを確認
   *
   * confirmの実装が「actionを取り出す→保留状態をクリアする→実行する」の順序になっていることを保証する。
   */
  test("confirm()後に再度confirm()しても保留アクションが二重実行されない", () => {
    const { result } = renderHook(() => useDiscardGuard());
    const action = vi.fn();

    act(() => {
      result.current.guard(true, action);
    });

    act(() => {
      result.current.confirm();
    });

    // ダイアログが既に閉じている状態で誤ってconfirmが再度呼ばれたケースを想定
    act(() => {
      result.current.confirm();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  /**
   * @test cancel()後は保留アクションがクリアされているため、その後confirm()を呼んでも何も実行されないことを確認
   */
  test("cancel()後にconfirm()を呼んでも保留アクションは実行されない", () => {
    const { result } = renderHook(() => useDiscardGuard());
    const action = vi.fn();

    act(() => {
      result.current.guard(true, action);
    });

    act(() => {
      result.current.cancel();
    });

    act(() => {
      result.current.confirm();
    });

    expect(action).not.toHaveBeenCalled();
  });

  /**
   * @test ConfirmDialogのonOpenChangeにcancelをそのまま渡す利用方法を想定し、
   * Esc等でダイアログが閉じられた場合も保留アクションが残らないことを確認
   */
  test("onOpenChange={cancel}の利用パターンでも保留アクションが残らない", () => {
    const { result } = renderHook(() => useDiscardGuard());
    const action = vi.fn();

    act(() => {
      result.current.guard(true, action);
    });

    // RadixのonOpenChangeはbooleanを渡すが、cancelは引数を無視して常に閉じる
    act(() => {
      result.current.cancel();
    });

    expect(result.current.isOpen).toBe(false);

    // 保留アクションが残っていないことを、後続のguard(false, ...)の独立動作で確認
    const nextAction = vi.fn();
    act(() => {
      result.current.guard(false, nextAction);
    });

    expect(nextAction).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
  });
});
