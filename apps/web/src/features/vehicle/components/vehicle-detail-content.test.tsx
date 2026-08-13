import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { VehicleDetailContent } from "./vehicle-detail-content";

// ルーター移動を検証するためのモック関数
const mockPush = vi.fn();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({ vehicleId: "vehicle-id-123" }),
  // ownerIdクエリパラメータ無しのケースを想定
  useSearchParams: () => new URLSearchParams(),
}));

// ヘッダータイトル制御フックをモック化（HeaderProvider無しで動作させる）
vi.mock("@/shared/hooks/use-header", () => ({
  useHeader: vi.fn(),
}));

// 車両詳細取得フックのモック化用関数
const mockRefetchVehicle = vi.fn();
let vehicleState: {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  refetch: typeof mockRefetchVehicle;
};

vi.mock("../hooks/use-vehicle-detail", () => ({
  useVehicleDetail: () => vehicleState,
}));

// フォーム選択肢取得フックのモック化用関数
const mockRefetchOptions = vi.fn();
let formOptionsState: {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  refetch: typeof mockRefetchOptions;
};

vi.mock("../hooks/use-vehicle-form-options", () => ({
  useVehicleFormOptions: () => formOptionsState,
}));

// 車両更新処理フックのモック化
const mockUpdateVehicle = vi.fn();
vi.mock("../hooks/use-update-vehicle", () => ({
  useUpdateVehicle: () => ({
    updateVehicle: mockUpdateVehicle,
    isLoading: false,
    error: null,
  }),
}));

// 車両削除処理フックのモック化
const mockDeleteVehicle = vi.fn();
vi.mock("../hooks/use-delete-vehicle", () => ({
  useDeleteVehicle: () => ({
    deleteVehicle: mockDeleteVehicle,
  }),
}));

const VEHICLE = {
  id: "vehicle-id-123",
  vehicleType: "CAR",
  modelName: "RX-7",
  manufacturerName: "マツダ",
  modelCode: "FD3S",
  engineCode: "13B-REW",
  modelYear: 2002,
  licensePlate: "品川 300 な 77-77",
  imageUrl: null,
  currentMileage: 85000,
  transmissionType: "MT",
  driveType: "FR",
  memo: "オーナーのメイン車両",
};

const FORM_OPTIONS = {
  manufacturers: [
    { id: 1, name: "トヨタ" },
    { id: 4, name: "マツダ" },
  ],
  transmissionTypes: [
    { value: "MT", label: "MT" },
    { value: "AT", label: "AT" },
  ],
  driveTypes: [
    { value: "FR", label: "FR" },
    { value: "FF", label: "FF" },
  ],
};

/**
 * VehicleDetailContent（車両詳細・更新画面）の単体テスト
 */
describe("VehicleDetailContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleState = {
      data: VEHICLE,
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicle,
    };
    formOptionsState = {
      data: FORM_OPTIONS,
      isPending: false,
      isError: false,
      refetch: mockRefetchOptions,
    };
  });

  /**
   * @test データ取得中はスケルトンUIが表示されることを確認
   */
  test("データ取得中はスケルトンUIを表示する", () => {
    vehicleState = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch: mockRefetchVehicle,
    };

    const { container } = render(<VehicleDetailContent />);

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  /**
   * @test データ取得に失敗した場合、エラー表示に切り替わり両方のrefetchが呼ばれることを確認
   */
  test("データ取得に失敗した場合はエラー表示に切り替わる", async () => {
    const user = userEvent.setup();
    vehicleState = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mockRefetchVehicle,
    };

    render(<VehicleDetailContent />);

    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /再試行/ }));
    expect(mockRefetchVehicle).toHaveBeenCalledTimes(1);
    expect(mockRefetchOptions).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 初期状態（閲覧モード）では、取得した車両情報が読み取り専用テキストとして
   * 表示され、入力欄が存在しないことを確認
   */
  test("初期状態は閲覧モードで読み取り専用表示になる", () => {
    render(<VehicleDetailContent />);

    expect(screen.getByText("RX-7")).toBeInTheDocument();
    expect(screen.getByText("マツダ")).toBeInTheDocument();
    // 閲覧モードでは入力欄（textbox）が存在しない
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /保存/ }),
    ).not.toBeInTheDocument();
  });

  /**
   * @test 編集モードへ切り替えると、入力欄が表示され既存値が反映されていることを確認
   */
  test("編集モードへ切り替えると入力欄が表示される", async () => {
    const user = userEvent.setup();
    render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));

    expect(screen.getByPlaceholderText("RX-7")).toHaveValue("RX-7");
    expect(screen.getByRole("button", { name: /保存/ })).toBeInTheDocument();
  });

  /**
   * @test 編集モードで変更を加えた状態で閲覧モードへ戻そうとすると、
   * 確認ダイアログが表示されることを確認
   */
  test("編集内容がある状態で閲覧モードへ戻すと確認ダイアログが表示される", async () => {
    const user = userEvent.setup();
    render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.clear(screen.getByPlaceholderText("RX-7"));
    await user.type(screen.getByPlaceholderText("RX-7"), "FD3S RX-7");

    await user.click(screen.getByRole("button", { name: "閲覧モード" }));

    expect(
      await screen.findByText("編集内容を破棄しますか？"),
    ).toBeInTheDocument();
  });

  /**
   * @test 確認ダイアログで「破棄する」を選択すると、編集内容が破棄され閲覧モードに戻ることを確認
   */
  test("確認ダイアログで破棄すると編集内容が破棄され閲覧モードに戻る", async () => {
    const user = userEvent.setup();
    render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.clear(screen.getByPlaceholderText("RX-7"));
    await user.type(screen.getByPlaceholderText("RX-7"), "FD3S RX-7");
    await user.click(screen.getByRole("button", { name: "閲覧モード" }));

    await user.click(await screen.findByRole("button", { name: "破棄する" }));

    // 閲覧モードに戻り、破棄前の元の値が表示されている
    expect(screen.queryByPlaceholderText("RX-7")).not.toBeInTheDocument();
    expect(screen.getByText("RX-7")).toBeInTheDocument();
  });

  /**
   * @test 編集内容を保存すると、変換済みデータでupdateVehicleが呼ばれることを確認
   */
  test("編集内容を保存するとupdateVehicleが呼ばれる", async () => {
    const user = userEvent.setup();
    mockUpdateVehicle.mockResolvedValue(true);
    render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.clear(screen.getByPlaceholderText("RX-7"));
    await user.type(screen.getByPlaceholderText("RX-7"), "FD3S RX-7");
    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
    const [payload, image] = mockUpdateVehicle.mock.calls[0];
    expect(payload).toMatchObject({
      vehicleType: "CAR",
      modelName: "FD3S RX-7",
      manufacturerId: 4,
      modelYear: 2002,
      currentMileage: 85000,
    });
    expect(image).toBeNull();
  });

  /**
   * @test 編集モードで削除ボタンを押すと削除確認ダイアログが表示され、
   * 「削除する」を選択するとdeleteVehicleが呼ばれることを確認
   */
  test("削除ボタン押下→確認で削除処理が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.click(screen.getByRole("button", { name: "削除" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("この車両を削除しますか？"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "削除する" }));

    expect(mockDeleteVehicle).toHaveBeenCalledTimes(1);
  });
});
