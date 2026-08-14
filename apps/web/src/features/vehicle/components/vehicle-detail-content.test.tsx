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
  canEdit: true,
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
   * @test 既存画像がある状態で画像削除ボタンを押すと、プレビューが消え、
   * 保存時にremoveImage=trueが送信されることを確認（ConfirmDialogは表示されない）
   */
  test("画像削除ボタンを押すとプレビューが消え、保存時にremoveImage=trueが送信される", async () => {
    const user = userEvent.setup();
    mockUpdateVehicle.mockResolvedValue(true);
    vehicleState = {
      data: { ...VEHICLE, imageUrl: "https://example.com/rx7.png" },
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicle,
    };

    render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    expect(screen.getByAltText("車両画像プレビュー")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "画像を削除" }));

    // ConfirmDialogは表示されず、即座にプレビューが消える
    expect(
      screen.queryByText("この車両を削除しますか？"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByAltText("車両画像プレビュー"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
    const [payload, image] = mockUpdateVehicle.mock.calls[0];
    expect(payload).toMatchObject({ removeImage: true });
    expect(image).toBeNull();
  });

  /**
   * @test テキスト等のフィールドは変更していなくても、画像削除ボタンのみを押した状態で
   * 「一覧へ戻る」を押すと確認ダイアログが表示されることを確認
   *
   * 画像（imageFile/isImageRemoved）はreact-hook-formの管理外のため、isDirtyだけで
   * 判定すると画像のみの変更が「変更なし」とみなされてしまう不具合の再発防止テスト。
   */
  test("画像削除のみの状態で一覧へ戻ろうとすると確認ダイアログが表示される", async () => {
    const user = userEvent.setup();
    vehicleState = {
      data: { ...VEHICLE, imageUrl: "https://example.com/rx7.png" },
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicle,
    };

    render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.click(screen.getByRole("button", { name: "画像を削除" }));
    await user.click(screen.getByRole("button", { name: /一覧へ戻る/ }));

    expect(
      await screen.findByText("編集内容を破棄しますか？"),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  /**
   * @test 画像削除ボタンを押した後に新しい画像を選択すると、削除予定が解除され、
   * 保存時にremoveImage=falseかつ選択した画像が送信されることを確認
   */
  test("画像削除後に新しい画像を選択すると削除予定が解除される", async () => {
    const user = userEvent.setup();
    mockUpdateVehicle.mockResolvedValue(true);
    vehicleState = {
      data: { ...VEHICLE, imageUrl: "https://example.com/rx7.png" },
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicle,
    };

    const { container } = render(<VehicleDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.click(screen.getByRole("button", { name: "画像を削除" }));

    const file = new File(["dummy"], "new-icon.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');
    await user.upload(input as HTMLInputElement, file);

    expect(screen.getByAltText("車両画像プレビュー")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
    const [payload, image] = mockUpdateVehicle.mock.calls[0];
    expect(payload).toMatchObject({ removeImage: false });
    expect(image).toBe(file);
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

  /**
   * @test canEdit=trueの場合（車両所有者本人）、閲覧/編集モードの切り替えUIが
   * 表示され、既存の編集機能が利用できることを確認
   */
  test("canEdit=trueの場合は編集モード切り替えUIが表示される", () => {
    render(<VehicleDetailContent />);

    expect(
      screen.getByRole("button", { name: "編集モード" }),
    ).toBeInTheDocument();
  });

  /**
   * @test canEdit=falseの場合（SHOPが顧客車両を閲覧している場合）、
   * 閲覧/編集モードの切り替えUI自体が表示されないことを確認
   */
  test("canEdit=falseの場合は編集モード切り替えUIが表示されない", () => {
    vehicleState = {
      data: { ...VEHICLE, canEdit: false },
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicle,
    };

    render(<VehicleDetailContent />);

    expect(
      screen.queryByRole("button", { name: "編集モード" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "閲覧モード" }),
    ).not.toBeInTheDocument();
  });

  /**
   * @test canEdit=falseの場合、編集モードへの切り替え手段が無いため
   * 削除ボタンも表示されないことを確認
   */
  test("canEdit=falseの場合は削除ボタンが表示されない", () => {
    vehicleState = {
      data: { ...VEHICLE, canEdit: false },
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicle,
    };

    render(<VehicleDetailContent />);

    expect(
      screen.queryByRole("button", { name: "削除" }),
    ).not.toBeInTheDocument();
  });
});
