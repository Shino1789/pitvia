import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { InviteCodeModal } from "./invite-code-modal";
import { queryClient } from "@/providers/query-provider";
import type { ShopInviteCode } from "../types/shop";

// API通信を担当するレイヤーをモック化し、GET/POST両方の呼び出しを検証できるようにする
vi.mock("../api/shop-api", () => ({
  shopApi: {
    getInviteCode: vi.fn(),
    issueInviteCode: vi.fn(),
  },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

// 23時間ちょうどだとMath.floorの丸めでテスト実行時のわずかな遅延により22時間表示に
// なり得るため、余裕を持たせて23時間5分後を basis にする
const CURRENT_CODE: ShopInviteCode = {
  code: "A7X9-K2LM",
  expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
};

const REISSUED_CODE: ShopInviteCode = {
  code: "B2Y8-Q9NP",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * アプリ実体と同じ共有QueryClientシングルトンでラップしてレンダリングする
 *
 * GET（useInviteCode）→POST（useIssueInviteCode）→キャッシュ反映というのが本コンポーネントの
 * 本質的な挙動であり、useIssueInviteCodeは`@/providers/query-provider`のシングルトンへ
 * 直接setQueryDataするため、テスト用に別インスタンスのQueryClientを作ってしまうと
 * GETとPOSTのキャッシュが繋がらない。そのため実際のシングルトンをそのまま利用し、
 * beforeEachでキャッシュをクリアしてテスト間の汚染を防ぐ。
 */
function renderModal(open = true) {
  return render(
    <QueryClientProvider client={queryClient}>
      <InviteCodeModal open={open} onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

/**
 * InviteCodeModal（招待コード発行モーダル）の単体テスト
 */
describe("InviteCodeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // テスト間でキャッシュが残らないようクリアし、GETエラー時の自動リトライで
    // テストが不必要に遅くならないようリトライを無効化する
    queryClient.clear();
    queryClient.setDefaultOptions({ queries: { retry: false } });
  });

  /**
   * @test モーダルが開いた際にタイトル・説明文が表示されることを確認
   */
  test("モーダルのタイトル・説明文が表示される", async () => {
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(CURRENT_CODE);

    renderModal();

    expect(screen.getByText("招待コードを発行")).toBeInTheDocument();
    expect(
      screen.getByText(/このコードをオーナーに共有してください/),
    ).toBeInTheDocument();
  });

  /**
   * @test 開いた際にGETで現在有効なコードを取得し、コードと有効期限を表示することを確認
   */
  test("GETで現在の招待コードを取得して表示する", async () => {
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(CURRENT_CODE);

    renderModal();

    await waitFor(() => {
      expect(screen.getByText("A7X9-K2LM")).toBeInTheDocument();
    });
    expect(shopApi.getInviteCode).toHaveBeenCalledTimes(1);
    // モーダルを開いただけでは新規発行（POST）は行わないこと
    expect(shopApi.issueInviteCode).not.toHaveBeenCalled();
    expect(screen.getByText(/有効期限/)).toBeInTheDocument();
    expect(screen.getByText(/残り23時間/)).toBeInTheDocument();
  });

  /**
   * @test 有効な招待コードが存在しない場合、その旨のメッセージと「発行する」ボタンが表示されることを確認
   */
  test("有効な招待コードが無い場合は「発行する」ボタンが表示される", async () => {
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(null);

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText("現在有効な招待コードはありません。"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "発行する" }),
    ).toBeInTheDocument();
  });

  /**
   * @test コピーボタン押下でクリップボードへ招待コードがコピーされ、成功トーストが表示されることを確認
   */
  test("コピーボタン押下でクリップボードへコードがコピーされる", async () => {
    const user = userEvent.setup();
    // userEvent.setup()はnavigator.clipboardへ実装を自動で用意するため、
    // それをspyOnして呼び出しを検証する（先にdefinePropertyで差し替えるとuserEvent側の
    // セットアップで上書きされてしまうため、setup()実行後にspyする）
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(CURRENT_CODE);

    renderModal();

    await screen.findByText("A7X9-K2LM");
    await user.click(screen.getByRole("button", { name: /コピー/ }));

    expect(writeTextSpy).toHaveBeenCalledWith("A7X9-K2LM");
    expect(appToast.success).toHaveBeenCalledWith(
      "招待コードをコピーしました。",
    );
  });

  /**
   * @test コピーボタン押下時にnavigator.clipboard.writeTextが失敗した場合、
   * 例外が未処理のまま伝播せず、エラートーストが表示されることを確認
   */
  test("コピー失敗時はエラートーストが表示される", async () => {
    const user = userEvent.setup();
    // userEvent.setup()はnavigator.clipboardへ実装を自動で用意するため、
    // それをspyOnしてreject（コピー失敗）させる
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValue(new Error("clipboard error"));
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(CURRENT_CODE);

    renderModal();

    await screen.findByText("A7X9-K2LM");
    await user.click(screen.getByRole("button", { name: /コピー/ }));

    expect(writeTextSpy).toHaveBeenCalledWith("A7X9-K2LM");
    await waitFor(() => {
      expect(appToast.error).toHaveBeenCalledWith(
        "招待コードのコピーに失敗しました。",
      );
    });
    expect(appToast.success).not.toHaveBeenCalled();
    // 失敗してもモーダルの表示中のコードには影響しないこと
    expect(screen.getByText("A7X9-K2LM")).toBeInTheDocument();
  });

  /**
   * @test 「再発行」押下でPOSTが実行され、新しいコードが表示されることを確認
   */
  test("再発行すると新しいコードが表示される", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(CURRENT_CODE);
    vi.mocked(shopApi.issueInviteCode).mockResolvedValue(REISSUED_CODE);

    renderModal();

    await screen.findByText("A7X9-K2LM");
    await user.click(screen.getByRole("button", { name: "再発行" }));

    await waitFor(() => {
      expect(screen.getByText("B2Y8-Q9NP")).toBeInTheDocument();
    });
    expect(screen.queryByText("A7X9-K2LM")).not.toBeInTheDocument();
    expect(shopApi.issueInviteCode).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 招待コード取得（GET）が失敗した場合、エラー表示と再試行ボタンが表示されることを確認
   */
  test("GET失敗時はエラー表示になる", async () => {
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.getInviteCode).mockRejectedValue(new Error("failed"));

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText("招待コードの取得に失敗しました。"),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });

  /**
   * @test 招待コード発行（POST）が失敗した場合、エラートーストが表示されることを確認
   */
  test("POST失敗時はエラートーストが表示される", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(CURRENT_CODE);
    vi.mocked(shopApi.issueInviteCode).mockRejectedValue(
      new Error("発行に失敗しました"),
    );

    renderModal();

    await screen.findByText("A7X9-K2LM");
    await user.click(screen.getByRole("button", { name: "再発行" }));

    await waitFor(() => {
      expect(appToast.error).toHaveBeenCalledWith("発行に失敗しました");
    });
    // 失敗時は表示中のコードを維持する
    expect(screen.getByText("A7X9-K2LM")).toBeInTheDocument();
  });

  /**
   * @test データ取得中はローディング表示になることを確認
   */
  test("データ取得中はローディング表示になる", async () => {
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.getInviteCode).mockReturnValue(new Promise(() => {}));

    renderModal();

    // DialogContentはRadixによりdocument.body直下へPortal描画されるため、
    // render()が返すcontainerではなくdocument全体から探す
    expect(
      document.body.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  /**
   * @test open=falseの場合はGETを実行しないことを確認（モーダルを開くまで問い合わせない）
   */
  test("open=falseの場合はGETを実行しない", async () => {
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.getInviteCode).mockResolvedValue(CURRENT_CODE);

    renderModal(false);

    expect(shopApi.getInviteCode).not.toHaveBeenCalled();
  });
});
