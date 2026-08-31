import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { VehicleListContent } from "./vehicle-list-content";
import { HeaderProvider } from "@/shared/providers/header-provider";
import { AppHeader } from "@/shared/components/layout/app-header";
import type { VehicleListResponse } from "../types/vehicle";

// URLのownerIdクエリパラメータを制御するためのモック用変数
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// 車両一覧取得フックのモック化用関数
let listState: {
  data: VehicleListResponse | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

const mockRefetch = vi.fn();

vi.mock("../hooks/use-vehicle-list", () => ({
  useVehicleList: () => listState,
}));

const VEHICLE_RX7 = {
  id: "vehicle-1",
  vehicleType: "CAR",
  modelName: "RX-7",
  manufacturerName: "マツダ",
  modelCode: "FD3S",
  engineCode: "13B-REW",
  modelYear: 2002,
  licensePlate: null,
  imageUrl: null,
  currentMileage: 85000,
  transmissionType: "MT",
  driveType: "FR",
  memo: null,
  canEdit: false,
};

const VEHICLE_GTR = {
  ...VEHICLE_RX7,
  id: "vehicle-2",
  modelName: "GT-R",
  modelCode: "BNR34",
};

/**
 * テスト対象コンポーネントを、実際のHeaderProvider/AppHeaderと組み合わせてレンダリングする
 *
 * VehicleListContentは検索・追加ボタンをuseHeaderのactionsとして登録する設計のため、
 * useHeaderをモック化すると実際のUIとして描画されない。そのため、この画面のテストのみ
 * 実際のHeaderProvider/AppHeaderと組み合わせてレンダリングする。
 */
function renderWithHeader() {
  return render(
    <HeaderProvider>
      <AppHeader onMenuClick={vi.fn()} />
      <VehicleListContent />
    </HeaderProvider>,
  );
}

/**
 * VehicleListContent（車両一覧画面）の単体テスト
 */
describe("VehicleListContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    listState = {
      data: { owner: null, vehicles: [VEHICLE_RX7, VEHICLE_GTR] },
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
   * @test 自分自身の一覧（owner=null）の場合、タイトルが固定文言になり、
   * 車両登録への導線（車両を追加ボタン）が表示されることを確認
   */
  test("自分の一覧の場合はタイトル固定＋車両を追加ボタンが表示される", () => {
    renderWithHeader();

    expect(screen.getByText("車両一覧")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /車両を追加/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("RX-7")).toBeInTheDocument();
    expect(screen.getByText("GT-R")).toBeInTheDocument();
  });

  /**
   * @test 対象オーナーが指定されている場合、タイトルに表示名が反映され、
   * 車両登録への導線が表示されないことを確認
   */
  test("顧客車両一覧の場合はオーナー名がタイトルに表示され、追加ボタンが無い", () => {
    mockSearchParams = new URLSearchParams("ownerId=owner-1");
    listState = {
      data: {
        owner: { id: "owner-1", userName: "田中 圭太" },
        vehicles: [VEHICLE_RX7],
      },
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("田中 圭太 様の車両一覧")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /車両を追加/ }),
    ).not.toBeInTheDocument();
  });

  /**
   * @test 車両が1台も登録されていない場合、空状態のメッセージが表示されることを確認
   */
  test("車両が0件の場合は空状態メッセージが表示される", () => {
    listState = {
      data: { owner: null, vehicles: [] },
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(
      screen.getByText("登録されている車両がありません"),
    ).toBeInTheDocument();
  });

  /**
   * @test 検索アイコンをクリックして車両名を入力すると、一致する車両のみに絞り込まれることを確認
   */
  test("検索キーワードで車両名を絞り込める", async () => {
    const user = userEvent.setup();
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "車両名で検索" }));
    await user.type(screen.getByPlaceholderText("車両名で検索"), "RX");

    expect(screen.getByText("RX-7")).toBeInTheDocument();
    expect(screen.queryByText("GT-R")).not.toBeInTheDocument();
  });

  /**
   * @test 検索キーワードに一致する車両が無い場合、専用の空状態メッセージが表示されることを確認
   */
  test("検索結果が0件の場合は専用の空状態メッセージが表示される", async () => {
    const user = userEvent.setup();
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "車両名で検索" }));
    await user.type(
      screen.getByPlaceholderText("車両名で検索"),
      "存在しない車両名",
    );

    expect(
      screen.getByText("該当する車両が見つかりません"),
    ).toBeInTheDocument();
  });

  /**
   * @test 顧客車両一覧（ownerId指定）から車両詳細へのリンクに、ownerIdが引き継がれることを確認
   */
  test("顧客車両一覧からの詳細リンクにownerIdが引き継がれる", () => {
    mockSearchParams = new URLSearchParams("ownerId=owner-1");
    listState = {
      data: {
        owner: { id: "owner-1", userName: "田中 圭太" },
        vehicles: [VEHICLE_RX7],
      },
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    const detailLink = screen.getByRole("link", { name: /車両詳細を見る/ });
    expect(detailLink).toHaveAttribute(
      "href",
      "/vehicles/vehicle-1?ownerId=owner-1",
    );
  });
});
