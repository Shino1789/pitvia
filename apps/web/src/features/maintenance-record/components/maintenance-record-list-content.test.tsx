import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { MaintenanceRecordListContent } from "./maintenance-record-list-content";
import { HeaderProvider } from "@/shared/providers/header-provider";
import { AppHeader } from "@/shared/components/layout/app-header";
import type { MaintenanceRecordListResponse } from "../types/maintenance-record";

// URLクエリパラメータを制御するためのモック用変数
let mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/maintenances",
  useSearchParams: () => mockSearchParams,
}));

// 整備履歴一覧取得フックのモック化用関数（呼び出し引数を検証できるようspyにする）
let listState: {
  data: MaintenanceRecordListResponse | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

const mockRefetch = vi.fn();
// 型引数で呼び出しシグネチャを明示することで、実装側に未使用の仮引数を持たせずに済む
const mockUseMaintenanceRecordList = vi.fn<(params: unknown) => typeof listState>(
  () => listState,
);

vi.mock("../hooks/use-maintenance-record-list", () => ({
  useMaintenanceRecordList: (params: unknown) =>
    mockUseMaintenanceRecordList(params),
}));

// 車両フィルタープルダウン用の車両一覧取得フックのモック化用関数（同様にspy化）
let vehicleListState: { data: unknown; isPending: boolean };
const mockUseVehicleList = vi.fn<(ownerId?: string) => typeof vehicleListState>(
  () => vehicleListState,
);

vi.mock("@/features/vehicle/hooks/use-vehicle-list", () => ({
  useVehicleList: (ownerId?: string) => mockUseVehicleList(ownerId),
}));

const VEHICLE_LIST_RESPONSE = {
  owner: null,
  vehicles: [
    { id: "vehicle-1", modelName: "RX-7", modelCode: "FD3S" },
    { id: "vehicle-2", modelName: "GT-R", modelCode: null },
  ],
};

const RECORD_OIL: MaintenanceRecordListResponse["records"]["content"][number] = {
  id: "record-1",
  vehicleId: "vehicle-1",
  vehicleModelName: "GT-R",
  vehicleModelCode: "R32",
  maintenanceType: "PERIODIC_MAINTENANCE",
  title: "エンジンオイル＆フィルター交換",
  workDateFrom: "2026-05-15",
  workDateTo: "2026-05-15",
  mileage: 89500,
  totalCost: 18500,
  shopName: "Advance Service Yokohama",
};

const RECORD_ECU: MaintenanceRecordListResponse["records"]["content"][number] = {
  id: "record-2",
  vehicleId: "vehicle-1",
  vehicleModelName: "GT-R",
  vehicleModelCode: "R32",
  maintenanceType: "SETTING",
  title: "ECUセッティング",
  workDateFrom: "2026-05-10",
  workDateTo: "2026-05-10",
  mileage: 89120,
  totalCost: 245000,
  shopName: "Craft Custom Shop",
};

/**
 * 指定件数のPageResponse付きMaintenanceRecordListResponseを生成する
 */
function buildResponse(
  content: MaintenanceRecordListResponse["records"]["content"],
  overrides: Partial<MaintenanceRecordListResponse> = {},
  pageOverrides: Partial<MaintenanceRecordListResponse["records"]> = {},
): MaintenanceRecordListResponse {
  return {
    owner: null,
    records: {
      content,
      page: 1,
      size: 20,
      totalElements: content.length,
      totalPages: 1,
      ...pageOverrides,
    },
    ...overrides,
  };
}

/**
 * テスト対象コンポーネントを、実際のHeaderProvider/AppHeaderと組み合わせてレンダリングする
 *
 * MaintenanceRecordListContentは検索・追加ボタンをuseHeaderのactionsとして登録する設計のため、
 * useHeaderをモック化すると実際のUIとして描画されない。そのため実際のHeaderProvider/AppHeaderと
 * 組み合わせてレンダリングする（vehicle-list-content.test.tsxと同様の対応）。
 */
function renderWithHeader() {
  return render(
    <HeaderProvider>
      <AppHeader onMenuClick={vi.fn()} />
      <MaintenanceRecordListContent />
    </HeaderProvider>,
  );
}

/**
 * router.replaceの直近の呼び出しURLをmockSearchParamsへ反映し、再レンダリングする
 * （URLクエリパラメータの往復をシミュレートする）
 */
function applyLastReplace(rerender: (ui: React.ReactElement) => void) {
  const lastCall = mockReplace.mock.calls.at(-1);
  const url = lastCall?.[0] as string;
  const queryString = url.includes("?") ? url.split("?")[1] : "";
  mockSearchParams = new URLSearchParams(queryString);
  rerender(
    <HeaderProvider>
      <AppHeader onMenuClick={vi.fn()} />
      <MaintenanceRecordListContent />
    </HeaderProvider>,
  );
}

/**
 * MaintenanceRecordListContent（整備履歴一覧画面）の単体テスト
 */
describe("MaintenanceRecordListContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    listState = {
      data: buildResponse([RECORD_OIL, RECORD_ECU]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };
    vehicleListState = { data: VEHICLE_LIST_RESPONSE, isPending: false };
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
   * @test API成功時、整備履歴カードが一覧表示されることを確認
   */
  test("初期表示時に整備履歴カードが一覧表示される", () => {
    renderWithHeader();

    expect(screen.getByText("整備履歴一覧")).toBeInTheDocument();
    expect(
      screen.getByText("エンジンオイル＆フィルター交換"),
    ).toBeInTheDocument();
    expect(screen.getByText("ECUセッティング")).toBeInTheDocument();
  });

  /**
   * @test 車両名が「車種名 型式」の順（例: GT-R R32）で表示されることを確認
   */
  test("車両名がGT-R R32形式（modelName modelCode順）で表示される", () => {
    renderWithHeader();

    expect(screen.getAllByText("GT-R R32").length).toBeGreaterThan(0);
  });

  /**
   * @test 整備履歴が0件、かつ絞り込み条件が無い場合の空状態メッセージを確認
   */
  test("整備履歴が0件の場合は空状態メッセージが表示される", () => {
    listState = {
      data: buildResponse([]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(
      screen.getByText("登録されている整備履歴がありません"),
    ).toBeInTheDocument();
  });

  /**
   * @test 絞り込み条件がある状態で0件の場合は専用の空状態メッセージが表示されることを確認
   */
  test("絞り込み中に0件の場合は専用の空状態メッセージが表示される", () => {
    mockSearchParams = new URLSearchParams("keyword=存在しない整備");
    listState = {
      data: buildResponse([]),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(
      screen.getByText("該当する整備履歴が見つかりません"),
    ).toBeInTheDocument();
  });

  /**
   * @test ownerIdに対応するオーナー名がタイトルに反映されることを確認
   */
  test("SHOPが顧客の整備履歴を見ている場合は「〇〇様の整備履歴一覧」と表示される", () => {
    listState = {
      data: buildResponse([RECORD_OIL], {
        owner: { id: "owner-1", userName: "田中 健太" },
      }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("田中 健太 様の整備履歴一覧")).toBeInTheDocument();
  });

  /**
   * @test ownerが無い場合（自分自身の整備履歴）は固定タイトルが表示されることを確認
   * （OWNER・SHOPいずれが自分自身の整備履歴を見る場合も同一の表示になる）
   */
  test("自分自身の整備履歴を見ている場合は固定タイトルが表示される（OWNER/SHOP共通）", () => {
    renderWithHeader();

    expect(screen.getByText("整備履歴一覧")).toBeInTheDocument();
  });

  /**
   * @test 整備履歴カードクリックで整備履歴詳細画面へのリンクになっており、キャンセル時に
   * 一覧へ戻れるよう現在のURL（returnTo）を引き継いでいることを確認
   */
  test("整備履歴カードは詳細画面へのリンクになっている", () => {
    renderWithHeader();

    const link = screen.getByRole("link", {
      name: /エンジンオイル＆フィルター交換/,
    });
    expect(link).toHaveAttribute(
      "href",
      "/maintenances/record-1?returnTo=%2Fmaintenances",
    );
  });

  /**
   * @test 「一覧へ戻る」押下で車両一覧画面へ遷移することを確認（自分自身の整備履歴の場合）
   */
  test("「一覧へ戻る」押下で車両一覧画面へ遷移する", async () => {
    const user = userEvent.setup();
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: /一覧へ戻る/ }));

    expect(mockPush).toHaveBeenCalledWith("/vehicles");
  });

  /**
   * @test 「一覧へ戻る」押下時、SHOPが顧客の整備履歴を見ている場合はownerId付きの
   * 車両一覧画面へ遷移することを確認
   */
  test("顧客の整備履歴を見ている場合の「一覧へ戻る」はownerId付きで車両一覧へ遷移する", async () => {
    const user = userEvent.setup();
    listState = {
      data: buildResponse([RECORD_OIL], {
        owner: { id: "owner-1", userName: "田中 健太" },
      }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    await user.click(screen.getByRole("button", { name: /一覧へ戻る/ }));

    expect(mockPush).toHaveBeenCalledWith("/vehicles?ownerId=owner-1");
  });

  /**
   * @test キーワード入力後、デバウンスを経てURLへkeywordが反映され、pageがリセットされることを確認
   */
  test("keyword検索でURLのkeywordが更新され、pageがリセットされる", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("page=3");
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "タイトルで検索" }));
    await user.type(screen.getByPlaceholderText("タイトルで検索"), "オイル");

    // デバウンス（400ms）を待つ
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockReplace).toHaveBeenCalled();
    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("keyword=");
    expect(url).not.toContain("page=");
  });

  /**
   * @test 整備種別を単一選択すると、URLのmaintenanceTypeが更新され、pageがリセットされることを確認
   */
  test("整備種別を単一選択できる", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("page=2");
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "修理" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("maintenanceType=REPAIR");
    expect(url).not.toContain("page=");
  });

  /**
   * @test 整備種別を複数選択すると、URLに両方の値が含まれることを確認
   */
  test("整備種別を複数選択できる", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithHeader();

    await user.click(screen.getByRole("button", { name: "修理" }));
    applyLastReplace(rerender);

    await user.click(screen.getByRole("button", { name: "カスタム" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.getAll("maintenanceType")).toEqual(
      expect.arrayContaining(["REPAIR", "CUSTOM"]),
    );
  });

  /**
   * @test 「すべて」を選択すると、他の整備種別の選択状態が解除されることを確認
   */
  test("「すべて」選択時は他フィルターが解除される", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("maintenanceType=REPAIR");
    renderWithHeader();

    await user.click(screen.getByRole("button", { name: "すべて" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).not.toContain("maintenanceType=");
  });

  /**
   * @test 他の整備種別を選択すると、「すべて」の選択状態が解除されることを確認
   */
  test("他の整備種別選択時は「すべて」が解除される", () => {
    mockSearchParams = new URLSearchParams();
    renderWithHeader();

    const allButton = screen.getByRole("button", { name: "すべて" });
    // 絞り込み無し（初期状態）では「すべて」が選択状態（aria-pressed=true）
    expect(allButton).toHaveAttribute("aria-pressed", "true");

    mockSearchParams = new URLSearchParams("maintenanceType=REPAIR");
    const { rerender } = renderWithHeader();
    void rerender;

    expect(
      screen.getAllByRole("button", { name: "すべて" }).at(-1),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getAllByRole("button", { name: "修理" }).at(-1),
    ).toHaveAttribute("aria-pressed", "true");
  });

  /**
   * @test 並び替えプルダウンを変更すると、URLのsortが更新され、pageがリセットされることを確認
   */
  test("並び替えを変更できる", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("page=2");
    renderWithHeader();

    // 車両フィルター・並び替えの2つのプルダウンが並ぶため、2番目（並び替え）を操作する
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[1]);
    await user.click(await screen.findByRole("option", { name: "日付（古い順）" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("sort=WORK_DATE_ASC");
    expect(url).not.toContain("page=");
  });

  /**
   * @test URLにvehicleIdとownerIdが両方指定されている場合、ownerIdを無視してAPIへ渡す
   * ことを確認（バックエンドAPIはvehicleId+ownerIdの同時指定を許容しないため）
   */
  test("vehicleId・ownerIdが両方指定されている場合はownerIdを無視してAPIへ渡す", () => {
    mockSearchParams = new URLSearchParams(
      "vehicleId=vehicle-1&ownerId=owner-1",
    );

    renderWithHeader();

    expect(mockUseMaintenanceRecordList).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleId: "vehicle-1", ownerId: undefined }),
    );
  });

  /**
   * @test 車両フィルターの選択肢取得元は、URLの生のownerIdではなく、整備履歴一覧APIの
   * レスポンス（data.owner）から解決した所有者であることを確認
   */
  test("車両フィルターはdata.ownerを車両一覧の取得元に使う", () => {
    // URLにownerIdは無いが、vehicleId指定によりdata.ownerで対象顧客が解決されるケース
    mockSearchParams = new URLSearchParams("vehicleId=vehicle-1");
    listState = {
      data: buildResponse([RECORD_OIL], {
        owner: { id: "owner-1", userName: "田中 健太" },
      }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(mockUseVehicleList).toHaveBeenCalledWith("owner-1");
  });

  /**
   * @test 特定車両（顧客の車両）を表示中に車両フィルターで「すべて」を選ぶと、
   * 自分自身の一覧（パラメータ無し）ではなく、その顧客の全車両分の一覧
   * （ownerId指定）へ切り替わることを確認
   */
  test("顧客車両を表示中に「すべて」を選ぶとその顧客のownerId指定へ切り替わる", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("vehicleId=vehicle-1");
    listState = {
      data: buildResponse([RECORD_OIL], {
        owner: { id: "owner-1", userName: "田中 健太" },
      }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };
    renderWithHeader();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(await screen.findByRole("option", { name: "すべて" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("ownerId=owner-1");
    expect(url).not.toContain("vehicleId=");
  });

  /**
   * @test 自分の車両を表示中に「すべて」を選ぶと、従来通りパラメータ無し
   * （自分自身の一覧）へ遷移することを確認（デグレ防止）
   */
  test("自分の車両を表示中に「すべて」を選ぶとパラメータ無しの一覧へ戻る", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("vehicleId=vehicle-1");
    // data.owner が null ＝ 自分自身の車両
    listState = {
      data: buildResponse([RECORD_OIL], { owner: null }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };
    renderWithHeader();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(await screen.findByRole("option", { name: "すべて" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).not.toContain("vehicleId=");
    expect(url).not.toContain("ownerId=");
  });

  /**
   * @test 顧客の全車両一覧（ownerId指定）から特定の車両を選ぶと、URLにownerIdが
   * 残らずvehicleIdのみになることを確認（vehicleId+ownerId同時指定の再発防止）
   */
  test("ownerId指定中に特定車両を選ぶとownerIdが残らない", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("ownerId=owner-1");
    listState = {
      data: buildResponse([RECORD_OIL], {
        owner: { id: "owner-1", userName: "田中 健太" },
      }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };
    renderWithHeader();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(await screen.findByRole("option", { name: "RX-7 FD3S" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("vehicleId=vehicle-1");
    expect(url).not.toContain("ownerId=");
  });

  /**
   * @test 車両フィルターで特定の車両を選択すると、URLのvehicleIdが更新され、
   * 他の絞り込み条件（keyword）は維持されたままpageがリセットされることを確認
   */
  test("車両フィルターを変更するとURLのvehicleIdが更新される", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("keyword=オイル&page=2");
    renderWithHeader();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(await screen.findByRole("option", { name: "RX-7 FD3S" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).toContain("vehicleId=vehicle-1");
    expect(url).toContain("keyword=");
    expect(url).not.toContain("page=");
  });

  /**
   * @test 車両で絞り込み中に「すべて」を選択すると、URLからvehicleIdが削除されることを確認
   */
  test("車両フィルターで「すべて」を選択するとvehicleIdが削除される", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("vehicleId=vehicle-1");
    renderWithHeader();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(await screen.findByRole("option", { name: "すべて" }));

    const [url] = mockReplace.mock.calls.at(-1) as [string];
    expect(url).not.toContain("vehicleId=");
  });

  /**
   * @test ページング操作でURLのpageが更新されることを確認（他の絞り込み条件は維持される）
   */
  test("ページ番号クリックでURLのpageが更新される", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("keyword=オイル");
    listState = {
      data: buildResponse([RECORD_OIL], {}, { page: 1, totalPages: 3, totalElements: 45 }),
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
      data: buildResponse([RECORD_OIL], {}, { totalElements: 178, totalPages: 9 }),
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };

    renderWithHeader();

    expect(screen.getByText("全178件")).toBeInTheDocument();
  });

  /**
   * @test 「+ 履歴を追加」ボタンが表示され、履歴登録画面へのリンクになっていることを確認。
   * 対象車両で絞り込み中の場合はvehicleIdを、キャンセル時に戻れるようreturnToも引き継ぐ。
   */
  test("「履歴を追加」ボタンが表示される", () => {
    renderWithHeader();

    const link = screen.getByRole("link", { name: /履歴を追加/ });
    expect(link).toHaveAttribute(
      "href",
      "/maintenances/new?returnTo=%2Fmaintenances",
    );
  });

  /**
   * @test vehicleIdで絞り込み中に「履歴を追加」を押下すると、登録画面のURLに
   * vehicleIdが引き継がれ、対象車両プルダウンの初期選択に使われることを確認
   */
  test("車両で絞り込み中は「履歴を追加」のリンクにvehicleIdが引き継がれる", () => {
    mockSearchParams = new URLSearchParams("vehicleId=vehicle-1");
    renderWithHeader();

    const link = screen.getByRole("link", { name: /履歴を追加/ });
    expect(link).toHaveAttribute(
      "href",
      "/maintenances/new?vehicleId=vehicle-1&returnTo=%2Fmaintenances%3FvehicleId%3Dvehicle-1",
    );
  });

  /**
   * @test ヘッダー内に検索・追加ボタンが表示されることを確認（AppHeader経由）
   */
  test("ヘッダーに検索ボタンが表示される", () => {
    renderWithHeader();

    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("button", { name: "タイトルで検索" }),
    ).toBeInTheDocument();
  });
});
