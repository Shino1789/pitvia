import { useContext } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { HeaderProvider } from "@/shared/providers/header-provider";
import { AppHeader } from "@/shared/components/layout/app-header";
import { HeaderDispatchContext } from "@/shared/context/header-context";
import { useHeader } from "./use-header";

/**
 * useHeader / HeaderProvider の再レンダリング循環に関する回帰テスト
 *
 * HeaderProviderはheaderState（AppHeaderが購読）とdispatch（useHeaderが購読）を
 * 別コンテキストに分離しており、setHeaderによるheaderState更新がuseHeader()の
 * 呼び出し元自身の再レンダリングを引き起こさない構造になっている。
 */
describe("useHeader / HeaderProvider", () => {
  /**
   * @test actionsをuseMemoで安定化していない画面でも、無限レンダリングループが
   * 発生しないことを確認する（state/dispatch分離前は、actionsが未メモ化の場合
   * 「render→setHeader→headerState更新→再render→actions再生成→…」の循環に陥っていた）
   */
  test("actionsを毎回新規生成する画面でも無限ループが発生しない", () => {
    let renderCount = 0;

    function Producer() {
      renderCount++;
      // 意図的にuseMemoを使わず、レンダリングのたびに新しいReactNodeを渡す
      useHeader({
        title: "テスト画面",
        actions: <button type="button">アクション</button>,
      });
      return <div>content</div>;
    }

    render(
      <HeaderProvider>
        <AppHeader onMenuClick={() => {}} />
        <Producer />
      </HeaderProvider>,
    );

    // 循環が残っていればrenderCountが際限なく増え続けるか、Reactが
    // "Maximum update depth exceeded" 等でレンダリング自体に失敗する
    expect(renderCount).toBeLessThanOrEqual(2);
    expect(screen.getByText("テスト画面")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "アクション" }),
    ).toBeInTheDocument();
  });

  /**
   * @test headerState（AppHeader側）の更新が、useHeader()の呼び出し元
   * （画面コンポーネント）の再レンダリングを引き起こさないことを確認する
   */
  test("headerStateの更新はuseHeader()利用側の再レンダリングを引き起こさない", async () => {
    const user = userEvent.setup();
    let producerRenderCount = 0;

    // useHeader()側の再レンダリング回数を計測するための画面コンポーネント
    function Producer() {
      producerRenderCount++;
      useHeader({ title: "初期タイトル" });
      return null;
    }

    // Producerとは無関係に、dispatchを直接呼び出してheaderStateを更新するコンポーネント
    function Toggler() {
      const dispatch = useContext(HeaderDispatchContext);
      return (
        <button
          type="button"
          onClick={() => dispatch?.setHeader({ title: "変更後タイトル" })}
        >
          タイトルを変更
        </button>
      );
    }

    render(
      <HeaderProvider>
        <AppHeader onMenuClick={() => {}} />
        <Producer />
        <Toggler />
      </HeaderProvider>,
    );

    expect(screen.getByText("初期タイトル")).toBeInTheDocument();
    const renderCountAfterMount = producerRenderCount;

    // Producerを経由せず、headerStateのみを更新する
    await user.click(screen.getByRole("button", { name: "タイトルを変更" }));

    // AppHeader側の表示には反映される
    expect(screen.getByText("変更後タイトル")).toBeInTheDocument();
    // しかしProducer（useHeader利用側）は再レンダリングされていない
    expect(producerRenderCount).toBe(renderCountAfterMount);
  });
});
