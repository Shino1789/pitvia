import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { ShopListContent } from "./shop-list-content";
import { HeaderProvider } from "@/shared/providers/header-provider";
import { AppHeader } from "@/shared/components/layout/app-header";
import type { PageResponse } from "@/shared/types/response";
import type { ShopSummary } from "../types/shop";

// URLクエリパラメータを制御するためのモック用変数
let mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/shops",
  useSearchParams: () => mockSearchParams,
}));

// ショップ一覧取得フックのモック化用関数（呼び出し引数を検証できるようspyにする）
let listState: {
  data: PageResponse<ShopSummary> | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

const mockRefetch = vi.fn();
const mockUseShopList = vi.fn<(params: unknown) => typeof listState>(
  () => listState,
);

vi.mock("../hooks/use-shop-list", () => ({
  useShopList: (params: unknown) => mockUseShopList(params),
}));

// ショップ連携モーダルは開閉状態の受け渡しのみを検証すればよいため、
// 自身のデータ取得を持つ実コンポーネントには依存せずスタブに差し替える
vi.mock("./shop-link-modal", () => ({
  ShopLinkModal: ({ open }: { open: boolean }) =>
    open ? <div>link-modal-open</div> : null,
}));

const SHOP_ADVANCE: ShopSummary = {
  shopId: "shop-1",
  shopName: "Advance Service Yokohama",
  shopIconUrl: null,
  address: "神奈川県横浜市都筑区中川中央1-2-3",
  phoneNumber: "045-123-4567",
  linkedVehicles: [
    { vehicleId: "v-1", vehicleName: "RX-7 (FD3S)", imageUrl: null },
    { vehicleId: "v-2", vehicleName: "R32 GT-R", imageUrl: null },
  ],
  linkedVehicleCount: 2,
};

const SHOP_CLASSIC: ShopSummary = {
  shopId: "shop-2",
  shopName: "Classic Car Garage",
  shopIconUrl: null,
  address: null,
  phoneNumber: null,
  linkedVehicles: [
    { vehicleId: "v-3", vehicleName: "180SX", imageUrl: null },
    { vehicleId: "v-4", vehicleName: "S30Z", imageUrl: null },
    { vehicleId: "v-5", vehicleName: "AE86", imageUrl: null },
  ],
  linkedVehicleCount: 5,
};

/**
 * 指定件数のPageResponse<ShopSummary>を生成する
 */
function buildResponse(
  content: ShopSummary[],
  overrides: Partial<PageResponse<ShopSummary>> = {},
): PageResponse<ShopSummary> {
  return {
    content,
    page: 1,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    ...overrides,
  };
}

/**
 * テスト対象コンポーネントを、実際のHeaderProvider/AppHeaderと組み合わせてレンダリングする
 *
 * ShopListContentは検索・ショップ連携ボタンをuseHeaderのactionsとして登録する設計のため、
 * useHeaderをモック化すると実際のUIとして描画されない。
 */
function renderWithHeader() {
  return render(
    <HeaderProvider>
      <AppHeader onMenuClick={vi.fn()} />
      <ShopListContent />
    </HeaderProvider>,
  );
}

/**
 * ShopListContent（ショップ一覧画面）の単体テスト
 */
describe("ShopListContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    listState = {
      data: buildResponse([SHOP_ADVANCE, SHOP_CLASSIC]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };
  });

  /**
   * @test データ取得中はスケルトンUIが表示されることを確認
   */
  test("データ取得中はスケルトンUIを表示する", () => {
    listState = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch: mockRefetch,
    };

    const { container } = renderWithHeader();

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  /**
   * @test データ取得に失敗した場合、エラー表示に切り替わり再試行できることを確認
   */
  test("データ取得に失敗した場合はエラー表示に切り替わる", async () => {
    const user = userEvent.setup();
    listState = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /再試行/ }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  /**
   * @test API成功時、画面タイトルとショップカードが一覧表示されることを確認
   */
  test("初期表示時にショップカードが一覧表示される", () => {
    renderWithHeader();

    expect(screen.getByText("ショップ管理")).toBeInTheDocument();
    expect(screen.getByText("Advance Service Yokohama")).toBeInTheDocument();
    expect(screen.getByText("Classic Car Garage")).toBeInTheDocument();
  });

  /**
   * @test ショップの住所・電話番号・連携車両が表示されることを確認
   */
  test("住所・電話番号・連携車両が表示される", () => {
    renderWithHeader();

    expect(
      screen.getByText("神奈川県横浜市都筑区中川中央1-2-3"),
    ).toBeInTheDocument();
    expect(screen.getByText("045-123-4567")).toBeInTheDocument();
    // 連携車両は「 / 」区切りで表示される
    expect(screen.getByText("RX-7 (FD3S) / R32 GT-R")).toBeInTheDocument();
  });

  /**
   * @test 連携車両が表示件数（3件）を超える場合、「他N台」で残数が表示されることを確認
   * （N = linkedVehicleCount - 表示中の件数。2台のショップには表示されない）
   */
  test("連携車両が5台の場合は「他2台」が表示される", () => {
    renderWithHeader();

    expect(screen.getByText("他2台")).toBeInTheDocument();
    expect(screen.getAllByText(/^他\d+台$/)).toHaveLength(1);
  });

  /**
   * @test 住所・電話番号が未登録（null）の場合、その行が表示されないことを確認
   */
  test("住所・電話番号がnullの場合は表示されない", () => {
    listState = {
      data: buildResponse([SHOP_CLASSIC]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("Classic Car Garage")).toBeInTheDocument();
    expect(screen.queryByText("045-123-4567")).not.toBeInTheDocument();
  });

  /**
   * @test ショップ詳細画面はベータ版対象外のため、カードが遷移リンクになっていないことを確認
   */
  test("ショップカードは詳細画面への遷移リンクになっていない", () => {
    renderWithHeader();

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  /**
   * @test ショップが0件、かつ絞り込み条件が無い場合の空状態メッセージを確認
   */
  test("ショップが0件の場合は空状態メッセージが表示される", () => {
    listState = {
      data: buildResponse([]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("連携中のショップがありません")).toBeInTheDocument();
  });

  /**
   * @test 絞り込み条件がある状態で0件の場合は専用の空状態メッセージが表示されることを確認
   */
  test("検索中に0件の場合は専用の空状態メッセージが表示される", () => {
    mockSearchParams = new URLSearchParams("keyword=存在しないショップ");
    listState = {
      data: buildResponse([]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(
      screen.getByText("該当するショップが見つかりません"),
    ).toBeInTheDocument();
  });

  /**
   * @test キーワード入力後、デバウンスを経てURLへkeywordが反映され、pageがリセットされることを確認
   */
  test("keyword検索でURLのkeywordが更新され、pageがリセットされる", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("page=3");
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "ショップ名で検索" }));
    await user.type(screen.getByPlaceholderText("ショップ名で検索"), "横浜");

    // デバウンス（400ms）を待つ
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockReplace).toHaveBeenCalled();
    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("keyword=");
    expect(url).not.toContain("page=");
  });

  /**
   * @test URLのkeyword・pageがuseShopListへ正しく渡されることを確認
   */
  test("URLのkeyword・pageがuseShopListへ渡される", () => {
    mockSearchParams = new URLSearchParams("keyword=横浜&page=2");
    renderWithHeader();

    expect(mockUseShopList).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "横浜", page: 2, size: 20 }),
    );
  });

  /**
   * @test URLにkeyword・pageが無い場合、keywordはundefined・page=1で取得することを確認
   */
  test("URLパラメータが無い場合はkeywordなし・page=1で取得する", () => {
    renderWithHeader();

    expect(mockUseShopList).toHaveBeenCalledWith({
      keyword: undefined,
      page: 1,
      size: 20,
    });
  });

  /**
   * @test ページング操作でURLのpageが更新されることを確認（検索条件は維持される）
   */
  test("ページ番号クリックでURLのpageが更新される", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("keyword=横浜");
    listState = {
      data: buildResponse([SHOP_ADVANCE], {
        page: 1,
        totalPages: 3,
        totalElements: 45,
      }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "2" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("page=2");
    expect(url).toContain("keyword=");
  });

  /**
   * @test 全件数がページング付近に表示されることを確認
   */
  test("全件数が表示される", () => {
    listState = {
      data: buildResponse([SHOP_ADVANCE], { totalElements: 23, totalPages: 2 }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("全23件")).toBeInTheDocument();
  });

  /**
   * @test 「ショップ連携」ボタン押下でモーダルが開くことを確認
   */
  test("「ショップ連携」ボタン押下でモーダルが開く", async () => {
    const user = userEvent.setup();
    renderWithHeader();

    expect(screen.queryByText("link-modal-open")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ショップ連携/ }));

    expect(screen.getByText("link-modal-open")).toBeInTheDocument();
  });
});
