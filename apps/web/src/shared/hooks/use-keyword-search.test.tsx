import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { useKeywordSearch } from "./use-keyword-search";

// URLクエリパラメータを制御するためのモック用変数
let mockSearchParams = new URLSearchParams();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/shops",
  useSearchParams: () => mockSearchParams,
}));

/** デバウンス待機時間（ms）。フック内部の定数と一致させる */
const DEBOUNCE_MS = 400;

/**
 * useKeywordSearch（キーワード検索のデバウンス＋URL反映）の単体テスト
 */
describe("useKeywordSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * @test URLのkeywordが、確定済みキーワードとして返ることを確認（初期URLからの検索条件復元）
   */
  test("URLのkeywordが確定済みキーワードとして返る", () => {
    mockSearchParams = new URLSearchParams("keyword=abc");

    const { result } = renderHook(() => useKeywordSearch());

    expect(result.current.keywordParam).toBe("abc");
  });

  /**
   * @test URLにkeywordが無い場合は空文字が返ることを確認
   */
  test("URLにkeywordが無い場合は空文字を返す", () => {
    const { result } = renderHook(() => useKeywordSearch());

    expect(result.current.keywordParam).toBe("");
  });

  /**
   * @test 入力後、400ms経過するまではURLが更新されず、経過後にkeywordが反映されることを確認
   */
  test("入力から400ms後にURLのkeywordが更新される", () => {
    const { result } = renderHook(() => useKeywordSearch());

    act(() => {
      result.current.setKeywordInput("abc");
    });

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS - 1);
    });
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/shops?keyword=abc", {
      scroll: false,
    });
  });

  /**
   * @test 連続して入力した場合、途中の値は反映されず最後の値のみが1回だけ反映されることを確認
   */
  test("連続入力では最後の値のみ反映される", () => {
    const { result } = renderHook(() => useKeywordSearch());

    act(() => {
      result.current.setKeywordInput("a");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => {
      result.current.setKeywordInput("ab");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => {
      result.current.setKeywordInput("abc");
    });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/shops?keyword=abc", {
      scroll: false,
    });
  });

  /**
   * @test keywordの更新時にpageがURLから削除され、1ページ目へ戻ることを確認（他の条件は維持される）
   */
  test("keyword更新時にpageが削除され、他のパラメータは維持される", () => {
    mockSearchParams = new URLSearchParams("page=3&sort=asc");
    const { result } = renderHook(() => useKeywordSearch());

    act(() => {
      result.current.setKeywordInput("abc");
    });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("keyword=abc");
    expect(url).toContain("sort=asc");
    expect(url).not.toContain("page=");
  });

  /**
   * @test 前後の空白は除去されてURLへ反映されることを確認
   */
  test("前後の空白は除去して反映される", () => {
    const { result } = renderHook(() => useKeywordSearch());

    act(() => {
      result.current.setKeywordInput("  abc  ");
    });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(mockReplace).toHaveBeenCalledWith("/shops?keyword=abc", {
      scroll: false,
    });
  });

  /**
   * @test 空文字（または空白のみ）を入力した場合、URLからkeywordが削除されることを確認
   */
  test("空文字を入力するとURLのkeywordが削除される", () => {
    mockSearchParams = new URLSearchParams("keyword=abc&page=2");
    const { result } = renderHook(() => useKeywordSearch());

    act(() => {
      result.current.setKeywordInput("   ");
    });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(mockReplace).toHaveBeenCalledWith("/shops", { scroll: false });
  });

  /**
   * @test 入力値がURLの確定値と同じ場合は、URLを更新しないことを確認（不要な遷移・pageリセットの防止）
   */
  test("入力値がURLの値と同じ場合は更新しない", () => {
    mockSearchParams = new URLSearchParams("keyword=abc&page=2");
    const { result } = renderHook(() => useKeywordSearch());

    act(() => {
      result.current.setKeywordInput("abc ");
    });
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  /**
   * @test 検索欄を閉じた（clearKeyword）際、即座にkeywordとpageがURLから削除されることを確認
   */
  test("clearKeywordでkeywordとpageが即座にURLから削除される", () => {
    mockSearchParams = new URLSearchParams("keyword=abc&page=2&sort=asc");
    const { result } = renderHook(() => useKeywordSearch());

    act(() => {
      result.current.clearKeyword();
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/shops?sort=asc", {
      scroll: false,
    });
  });

  /**
   * @test ブラウザの戻る・進むでURLのkeywordだけが変わった場合、古い入力値がURLへ書き戻されないことを確認
   */
  test("URLのkeywordが外部要因で変わっても入力値で上書きしない", () => {
    mockSearchParams = new URLSearchParams("keyword=abc");
    const { result, rerender } = renderHook(() => useKeywordSearch());

    // 「戻る」操作でURLのkeywordが変化した状態を再現する
    mockSearchParams = new URLSearchParams("keyword=xyz");
    rerender();
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS * 2);
    });

    expect(result.current.keywordParam).toBe("xyz");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
