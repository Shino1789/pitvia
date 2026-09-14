import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { CustomerListContent } from "./customer-list-content";
import { HeaderProvider } from "@/shared/providers/header-provider";
import { AppHeader } from "@/shared/components/layout/app-header";
import type { PageResponse } from "@/shared/types/response";
import type { CustomerSummary } from "../types/customer";

// URLクエリパラメータを制御するためのモック用変数
let mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/customers",
  useSearchParams: () => mockSearchParams,
}));

// 顧客一覧取得フックのモック化用関数（呼び出し引数を検証できるようspyにする）
let listState: {
  data: PageResponse<CustomerSummary> | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

const mockRefetch = vi.fn();
const mockUseCustomerList = vi.fn<(params: unknown) => typeof listState>(
  () => listState,
);

vi.mock("../hooks/use-customer-list", () => ({
  useCustomerList: (params: unknown) => mockUseCustomerList(params),
}));

// 招待コード発行モーダルは開閉状態の受け渡しのみを検証すればよいため、
// 自身のデータ取得を持つ実コンポーネントには依存せずスタブに差し替える
vi.mock("@/features/shop/components/invite-code-modal", () => ({
  InviteCodeModal: ({ open }: { open: boolean }) =>
    open ? <div>invite-modal-open</div> : null,
}));

const CUSTOMER_TANAKA: CustomerSummary = {
  ownerId: "owner-1",
  ownerName: "田中 健太",
  ownerIconUrl: null,
  lastMaintenanceDate: "2026-05-21",
  linkedVehicles: [
    { vehicleId: "v-1", vehicleName: "RX-7", imageUrl: null },
    { vehicleId: "v-2", vehicleName: "GT-R", imageUrl: null },
  ],
  linkedVehicleCount: 2,
};

const CUSTOMER_YAMADA: CustomerSummary = {
  ownerId: "owner-2",
  ownerName: "山田 太郎",
  ownerIconUrl: null,
  lastMaintenanceDate: null,
  linkedVehicles: [
    { vehicleId: "v-3", vehicleName: "S2000", imageUrl: null },
    { vehicleId: "v-4", vehicleName: "AE86", imageUrl: null },
    { vehicleId: "v-5", vehicleName: "GR86", imageUrl: null },
    { vehicleId: "v-6", vehicleName: "86", imageUrl: null },
  ],
  linkedVehicleCount: 4,
};

/**
 * 指定件数のPageResponse<CustomerSummary>を生成する
 */
function buildResponse(
  content: CustomerSummary[],
  overrides: Partial<PageResponse<CustomerSummary>> = {},
): PageResponse<CustomerSummary> {
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
 * CustomerListContentは検索・招待コード発行ボタンをuseHeaderのactionsとして登録する設計のため、
 * useHeaderをモック化すると実際のUIとして描画されない。
 */
function renderWithHeader() {
  return render(
    <HeaderProvider>
      <AppHeader onMenuClick={vi.fn()} />
      <CustomerListContent />
    </HeaderProvider>,
  );
}

/**
 * CustomerListContent（顧客一覧画面）の単体テスト
 */
describe("CustomerListContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    listState = {
      data: buildResponse([CUSTOMER_TANAKA, CUSTOMER_YAMADA]),
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
   * @test API成功時、顧客カードが一覧表示されることを確認
   */
  test("初期表示時に顧客カードが一覧表示される", () => {
    renderWithHeader();

    expect(screen.getByText("顧客一覧")).toBeInTheDocument();
    expect(screen.getByText("田中 健太")).toBeInTheDocument();
    expect(screen.getByText("山田 太郎")).toBeInTheDocument();
    // 「様」がそれぞれの顧客名に付与されている
    expect(screen.getAllByText("様").length).toBe(2);
  });

  /**
   * @test 連携車両が3台以下の場合、残数バッジが表示されないことを確認
   */
  test("連携車両が2台の場合は残数バッジが表示されない", () => {
    renderWithHeader();

    // 田中様（2台）のカードに限定して検証する（山田様は4台のため+1バッジを持つ）
    const tanakaCard = screen.getByRole("link", { name: /田中 健太/ });
    expect(within(tanakaCard).queryByText(/^\+/)).not.toBeInTheDocument();
  });

  /**
   * @test 連携車両が4台以上の場合、「+N」形式で残数が表示されることを確認
   * （N = linkedVehicleCount - 表示中の件数）
   */
  test("連携車両が4台の場合は+1バッジが表示される", () => {
    renderWithHeader();

    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  /**
   * @test lastMaintenanceDateが正しく「YYYY/MM/DD」形式で表示されることを確認
   */
  test("lastMaintenanceDateがYYYY/MM/DD形式で表示される", () => {
    renderWithHeader();

    expect(screen.getByText("2026/05/21")).toBeInTheDocument();
  });

  /**
   * @test lastMaintenanceDateがnullの場合、未整備であることが分かる表示になることを確認
   */
  test("lastMaintenanceDateがnullの場合は「未整備」と表示される", () => {
    renderWithHeader();

    expect(screen.getByText("未整備")).toBeInTheDocument();
  });

  /**
   * @test 顧客カードが対象オーナーの車両一覧画面（ownerId付き）へのリンクになっていることを確認
   */
  test("顧客カードは対象オーナーのownerId付き車両一覧画面へのリンクになっている", () => {
    renderWithHeader();

    const link = screen.getByRole("link", { name: /田中 健太/ });
    expect(link).toHaveAttribute("href", "/vehicles?ownerId=owner-1");
  });

  /**
   * @test 顧客が0件、かつ絞り込み条件が無い場合の空状態メッセージを確認
   */
  test("顧客が0件の場合は空状態メッセージが表示される", () => {
    listState = {
      data: buildResponse([]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("連携中の顧客がいません")).toBeInTheDocument();
  });

  /**
   * @test 絞り込み条件がある状態で0件の場合は専用の空状態メッセージが表示されることを確認
   */
  test("絞り込み中に0件の場合は専用の空状態メッセージが表示される", () => {
    mockSearchParams = new URLSearchParams("keyword=存在しない顧客");
    listState = {
      data: buildResponse([]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("該当する顧客が見つかりません")).toBeInTheDocument();
  });

  /**
   * @test キーワード入力後、デバウンスを経てURLへkeywordが反映され、pageがリセットされることを確認
   */
  test("keyword検索でURLのkeywordが更新され、pageがリセットされる", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("page=3");
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "顧客名で検索" }));
    await user.type(screen.getByPlaceholderText("顧客名で検索"), "田中");

    // デバウンス（400ms）を待つ
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockReplace).toHaveBeenCalled();
    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("keyword=");
    expect(url).not.toContain("page=");
  });

  /**
   * @test 検索クエリがuseCustomerListへ正しく渡されることを確認
   */
  test("URLのkeyword・pageがuseCustomerListへ渡される", () => {
    mockSearchParams = new URLSearchParams("keyword=田中&page=2");
    renderWithHeader();

    expect(mockUseCustomerList).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "田中", page: 2, size: 20 }),
    );
  });

  /**
   * @test ページング操作でURLのpageが更新されることを確認（検索条件は維持される）
   */
  test("ページ番号クリックでURLのpageが更新される", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("keyword=田中");
    listState = {
      data: buildResponse([CUSTOMER_TANAKA], { page: 1, totalPages: 3, totalElements: 45 }),
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
      data: buildResponse([CUSTOMER_TANAKA], { totalElements: 46, totalPages: 3 }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("全46件")).toBeInTheDocument();
  });

  /**
   * @test 「招待コード発行」ボタン押下でモーダルが開くことを確認
   */
  test("「招待コード発行」ボタン押下でモーダルが開く", async () => {
    const user = userEvent.setup();
    renderWithHeader();

    expect(screen.queryByText("invite-modal-open")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /招待コード発行/ }));

    expect(screen.getByText("invite-modal-open")).toBeInTheDocument();
  });
});
