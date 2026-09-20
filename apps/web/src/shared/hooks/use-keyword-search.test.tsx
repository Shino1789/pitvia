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

  /**
   * 「URL更新がフックへ伝わるまでに遅延がある」実際のNext.jsの挙動を再現するためのヘルパー
   *
   * router.replaceは呼び出した時点ではuseSearchParamsの値へ反映されず、次のrenderで初めて
   * 新しいURLが見える。呼び出し直後は古いURLのままレンダリングされ、この関数を呼んでから
   * rerender()した時点で、最後にreplaceされたURLが反映される。
   */
  function applyLastReplacedUrl() {
    const [url] = mockReplace.mock.calls.at(-1) as [string];
    mockSearchParams = new URLSearchParams(url.split("?")[1] ?? "");
  }

  describe("タイマー競合（古いURLパラメータでの再更新）", () => {
    /**
     * @test ケースA：通常の検索。入力から400ms後にURLへ反映され、pageは削除（1ページ目へ）されること。
     * URLの更新が反映された後は、追加の更新が発生しないことを確認
     */
    test("通常の検索：反映後に追加のURL更新が発生しない", () => {
      mockSearchParams = new URLSearchParams("page=3");
      const { result, rerender } = renderHook(() => useKeywordSearch());

      act(() => {
        result.current.setKeywordInput("RX-7");
      });
      act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenLastCalledWith("/shops?keyword=RX-7", {
        scroll: false,
      });

      applyLastReplacedUrl();
      rerender();
      act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS * 3);
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    /**
     * @test ケースB：検索クリア（×）。クリア直後にeffectが再設定するタイマーが、URL更新後に
     * 古い状態のまま二重にURLを更新しないことを確認
     */
    test("クリア後、400ms経過しても二重にURLを更新しない", () => {
      mockSearchParams = new URLSearchParams("keyword=RX-7&page=2");
      const { result, rerender } = renderHook(() => useKeywordSearch());

      act(() => {
        result.current.clearKeyword();
      });
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenLastCalledWith("/shops", { scroll: false });

      // URLの更新がフックへ反映される
      applyLastReplacedUrl();
      rerender();
      act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS * 3);
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(result.current.keywordParam).toBe("");
    });

    /**
     * @test ケースC：検索クリア後400ms以内に別のURL条件（sort等）が変更された場合、
     * 古いkeyword更新がその変更を上書きして元へ戻さないことを確認
     */
    test("クリア後400ms以内に別条件を変更しても、古い更新で上書きされない", () => {
      mockSearchParams = new URLSearchParams("keyword=RX-7&sort=asc");
      const { result, rerender } = renderHook(() => useKeywordSearch());

      act(() => {
        result.current.clearKeyword();
      });
      applyLastReplacedUrl();
      rerender();

      // クリア直後（400ms以内）に、画面側の操作で別のURL条件が変更される
      act(() => {
        vi.advanceTimersByTime(100);
      });
      mockSearchParams = new URLSearchParams("sort=desc");
      rerender();

      act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS * 3);
      });

      // クリア時の1回のみ。古いsearchParams（sort=asc）でのURL更新は行われない
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    /**
     * @test ケースD：入力後400ms以内に別のURL条件が変更された場合、タイマー発火時に
     * 最新のURLパラメータを基準にkeywordが反映され、別条件が失われないことを確認
     */
    test("入力後400ms以内に別条件が変更されても、最新のURLを基準に反映される", () => {
      const { result, rerender } = renderHook(() => useKeywordSearch());

      act(() => {
        result.current.setKeywordInput("RX-7");
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // 入力の確定前に、画面側の操作で別のURL条件が変更される
      mockSearchParams = new URLSearchParams("sort=desc");
      rerender();
      act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
      const [url] = mockReplace.mock.calls[0] as [string];
      expect(url).toContain("keyword=RX-7");
      expect(url).toContain("sort=desc");
    });

    /**
     * @test ケースE：入力の確定前に、URLのkeywordが既に入力値と同じ値へ変わっていた場合
     * （戻る・進む等）、タイマー発火時に不要なURL更新を行わないことを確認
     */
    test("発火時点でURLが既に入力値と同じなら更新しない", () => {
      const { result, rerender } = renderHook(() => useKeywordSearch());

      act(() => {
        result.current.setKeywordInput("RX-7");
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      mockSearchParams = new URLSearchParams("keyword=RX-7");
      rerender();
      act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    /**
     * @test ケースF：クリア→再度検索。クリア直後の新しい入力が通常どおり反映されることを確認
     * （タイマー競合の修正が、その後の正常な検索を妨げない）
     */
    test("クリア後に再度入力した検索は通常どおり反映される", () => {
      mockSearchParams = new URLSearchParams("keyword=RX-7");
      const { result, rerender } = renderHook(() => useKeywordSearch());

      act(() => {
        result.current.clearKeyword();
      });
      applyLastReplacedUrl();
      rerender();

      act(() => {
        result.current.setKeywordInput("S2000");
      });
      act(() => {
        vi.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockReplace).toHaveBeenCalledTimes(2);
      expect(mockReplace).toHaveBeenLastCalledWith("/shops?keyword=S2000", {
        scroll: false,
      });
    });
  });
});
