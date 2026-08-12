import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { VehicleRegisterContent } from "./vehicle-register-content";

// ルーター移動を検証するためのモック関数
const mockPush = vi.fn();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// ヘッダータイトル制御フックをモック化（HeaderProvider無しで動作させる）
vi.mock("@/shared/hooks/use-header", () => ({
  useHeader: vi.fn(),
}));

// フォーム選択肢取得フックのモック化用関数
const mockRefetch = vi.fn();
let formOptionsState: {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  refetch: typeof mockRefetch;
};

vi.mock("../hooks/use-vehicle-form-options", () => ({
  useVehicleFormOptions: () => formOptionsState,
}));

// 車両登録処理フックのモック化
const mockRegisterVehicle = vi.fn();
vi.mock("../hooks/use-register-vehicle", () => ({
  useRegisterVehicle: () => ({
    registerVehicle: mockRegisterVehicle,
    isLoading: false,
    error: null,
  }),
}));

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
 * VehicleRegisterContent（車両登録画面）の単体テスト
 */
describe("VehicleRegisterContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formOptionsState = {
      data: FORM_OPTIONS,
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    };
  });

  /**
   * @test 選択肢データ取得中はスケルトンUIが表示され、フォームが描画されないことを確認
   */
  test("データ取得中はスケルトンUIを表示する", () => {
    formOptionsState = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch: mockRefetch,
    };

    const { container } = render(<VehicleRegisterContent />);

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("メーカー")).not.toBeInTheDocument();
  });

  /**
   * @test 選択肢データ取得に失敗した場合、エラー表示に切り替わり再試行できることを確認
   */
  test("データ取得に失敗した場合はエラー表示に切り替わる", async () => {
    const user = userEvent.setup();
    formOptionsState = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mockRefetch,
    };

    render(<VehicleRegisterContent />);

    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /再試行/ }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 必須項目が未入力のまま送信した場合、登録処理が呼ばれないことを確認
   */
  test("必須項目未入力の場合はregisterVehicleが呼ばれない", async () => {
    const user = userEvent.setup();
    render(<VehicleRegisterContent />);

    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(mockRegisterVehicle).not.toHaveBeenCalled();
  });

  /**
   * @test 必須項目を全て入力して送信した場合、フォーム値がAPIリクエスト形式へ
   * 変換されてregisterVehicleが呼ばれることを確認
   */
  test("必須項目を入力して送信するとregisterVehicleが呼ばれる", async () => {
    const user = userEvent.setup();
    render(<VehicleRegisterContent />);

    // メーカー（Select）
    await user.click(screen.getByRole("combobox", { name: /メーカー/ }));
    await user.click(await screen.findByRole("option", { name: "マツダ" }));

    // 車名
    await user.type(screen.getByPlaceholderText("RX-7"), "RX-7");

    // 年式
    await user.type(screen.getByLabelText(/年式/), "2002");

    // 走行距離
    await user.type(screen.getByLabelText(/走行距離/), "85000");

    // トランスミッション（SegmentedToggle）
    await user.click(screen.getByRole("button", { name: "MT" }));

    // 駆動方式（Select）
    await user.click(screen.getByRole("combobox", { name: /駆動方式/ }));
    await user.click(await screen.findByRole("option", { name: "FR" }));

    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(mockRegisterVehicle).toHaveBeenCalledTimes(1);
    const [payload, image] = mockRegisterVehicle.mock.calls[0];
    expect(payload).toMatchObject({
      vehicleType: "CAR",
      modelName: "RX-7",
      manufacturerId: 4,
      modelYear: 2002,
      currentMileage: 85000,
      transmissionType: "MT",
      driveType: "FR",
    });
    expect(image).toBeNull();
  });

  /**
   * @test 未入力（変更なし）の状態でキャンセルした場合、確認ダイアログを出さずに
   * 即座に車両一覧へ遷移することを確認
   */
  test("変更が無い状態でキャンセルすると確認無しで一覧へ遷移する", async () => {
    const user = userEvent.setup();
    render(<VehicleRegisterContent />);

    await user.click(screen.getByRole("button", { name: /キャンセル/ }));

    expect(
      screen.queryByText("入力内容を破棄しますか？"),
    ).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/vehicles");
  });

  /**
   * @test 未保存の変更がある状態でキャンセルした場合、確認ダイアログが表示され、
   * その時点では遷移しないことを確認
   */
  test("変更がある状態でキャンセルすると確認ダイアログが表示される", async () => {
    const user = userEvent.setup();
    render(<VehicleRegisterContent />);

    await user.type(screen.getByPlaceholderText("RX-7"), "RX-7");
    await user.click(screen.getByRole("button", { name: /キャンセル/ }));

    expect(
      await screen.findByText("入力内容を破棄しますか？"),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  /**
   * @test 確認ダイアログで「破棄する」を選択すると、車両一覧へ遷移することを確認
   */
  test("確認ダイアログで破棄するを選択すると一覧へ遷移する", async () => {
    const user = userEvent.setup();
    render(<VehicleRegisterContent />);

    await user.type(screen.getByPlaceholderText("RX-7"), "RX-7");
    await user.click(screen.getByRole("button", { name: /キャンセル/ }));
    await user.click(await screen.findByRole("button", { name: "破棄する" }));

    expect(mockPush).toHaveBeenCalledWith("/vehicles");
  });

  /**
   * @test 確認ダイアログで「キャンセル」を選択すると、遷移せず入力内容が保持されることを確認
   */
  test("確認ダイアログでキャンセルすると遷移せず入力内容が保持される", async () => {
    const user = userEvent.setup();
    render(<VehicleRegisterContent />);

    await user.type(screen.getByPlaceholderText("RX-7"), "RX-7");
    await user.click(screen.getByRole("button", { name: /キャンセル/ }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "キャンセル" }));

    expect(
      screen.queryByText("入力内容を破棄しますか？"),
    ).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("RX-7")).toHaveValue("RX-7");
  });
});
