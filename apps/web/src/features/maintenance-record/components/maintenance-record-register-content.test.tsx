import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { MaintenanceRecordRegisterContent } from "./maintenance-record-register-content";

// ルーター移動を検証するためのモック関数
const mockPush = vi.fn();
// URLクエリパラメータ（vehicleId, returnTo）を制御するためのモック用変数
let mockSearchParams = new URLSearchParams();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// ヘッダータイトル制御フックをモック化（HeaderProvider無しで動作させる）
vi.mock("@/shared/hooks/use-header", () => ({
  useHeader: vi.fn(),
}));

// 車両一覧取得フックのモック化用関数（呼び出し引数を検証できるようspyにする）
const mockRefetchVehicles = vi.fn();
let vehicleListState: {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  refetch: typeof mockRefetchVehicles;
};
// 型引数で呼び出しシグネチャを明示することで、実装側に未使用の仮引数を持たせずに済む
const mockUseVehicleList = vi.fn<(ownerId?: string) => typeof vehicleListState>(
  () => vehicleListState,
);

vi.mock("@/features/vehicle/hooks/use-vehicle-list", () => ({
  useVehicleList: (ownerId?: string) => mockUseVehicleList(ownerId),
}));

// 整備履歴登録処理フックのモック化
const mockRegisterMaintenanceRecord = vi.fn();
vi.mock("../hooks/use-register-maintenance-record", () => ({
  useRegisterMaintenanceRecord: () => ({
    registerMaintenanceRecord: mockRegisterMaintenanceRecord,
    isLoading: false,
    error: null,
  }),
}));

const VEHICLE_LIST_RESPONSE = {
  owner: null,
  vehicles: [
    { id: "vehicle-1", modelName: "RX-7", modelCode: "FD3S" },
    { id: "vehicle-2", modelName: "GT-R", modelCode: null },
  ],
};

/**
 * 必須項目のみを入力する共通操作（送信は行わない）
 *
 * @param user userEventインスタンス
 */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  // 対象車両（Select）
  await user.click(screen.getByRole("combobox", { name: /対象車両/ }));
  await user.click(await screen.findByRole("option", { name: "RX-7 FD3S" }));

  // タイトル
  await user.type(
    screen.getByPlaceholderText("例：車検対応、オイル交換"),
    "車検対応",
  );

  // 整備種別（Select）
  await user.click(screen.getByRole("combobox", { name: /整備種別/ }));
  await user.click(await screen.findByRole("option", { name: "車検" }));

  // 作業開始日
  fireEvent.change(screen.getByLabelText(/作業開始日/), {
    target: { value: "2026-04-10" },
  });

  // 整備完了時の走行距離
  await user.type(screen.getByPlaceholderText("例：85000"), "70600");

  // 作業項目1件目：作業内容
  await user.type(
    screen.getByPlaceholderText("例：エンジンオイル交換、フィルター交換"),
    "エンジンオイル交換",
  );

  // 作業項目1件目：作業カテゴリ（Select）
  await user.click(screen.getByRole("combobox", { name: /作業カテゴリ/ }));
  await user.click(await screen.findByRole("option", { name: "エンジン" }));

  // 作業項目1件目：担当者名
  await user.type(
    screen.getByPlaceholderText("例：ガレージ田中、DIY"),
    "ガレージ田中",
  );

  // 作業項目1件目：工賃
  await user.type(screen.getByLabelText(/工賃/), "2000");
}

/**
 * 必須項目のみを入力して送信する共通操作
 *
 * @param user userEventインスタンス
 */
async function fillRequiredFieldsAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
) {
  await fillRequiredFields(user);
  await user.click(screen.getByRole("button", { name: /保存/ }));
}

/**
 * MaintenanceRecordRegisterContent（整備履歴登録画面）の単体テスト
 */
describe("MaintenanceRecordRegisterContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vehicleListState = {
      data: VEHICLE_LIST_RESPONSE,
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicles,
    };
  });

  /**
   * @test 車両一覧取得中はスケルトンUIが表示され、フォームが描画されないことを確認
   */
  test("データ取得中はスケルトンUIを表示する", () => {
    vehicleListState = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch: mockRefetchVehicles,
    };

    const { container } = render(<MaintenanceRecordRegisterContent />);

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("タイトル")).not.toBeInTheDocument();
  });

  /**
   * @test 車両一覧取得に失敗した場合、エラー表示に切り替わり再試行できることを確認
   */
  test("データ取得に失敗した場合はエラー表示に切り替わる", async () => {
    const user = userEvent.setup();
    vehicleListState = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mockRefetchVehicles,
    };

    render(<MaintenanceRecordRegisterContent />);

    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /再試行/ }));
    expect(mockRefetchVehicles).toHaveBeenCalledTimes(1);
  });

  /**
   * @test URLにvehicleIdが指定されている場合、対象車両プルダウンにその車両が
   * 初期選択されていることを確認（車両ごとに絞り込んだ一覧から遷移した場合の挙動）
   */
  test("URLのvehicleIdが対象車両プルダウンに初期選択される", () => {
    mockSearchParams = new URLSearchParams("vehicleId=vehicle-2");

    render(<MaintenanceRecordRegisterContent />);

    expect(
      screen.getByRole("combobox", { name: /対象車両/ }),
    ).toHaveTextContent("GT-R");
  });

  /**
   * @test URLにownerIdが指定されている場合（連携済み顧客の車両一覧から遷移した場合）、
   * その顧客の車両一覧取得のためownerIdがuseVehicleListへ渡されることを確認
   */
  test("URLのownerIdが車両一覧取得フックへ渡される", () => {
    mockSearchParams = new URLSearchParams(
      "vehicleId=vehicle-2&ownerId=owner-1",
    );

    render(<MaintenanceRecordRegisterContent />);

    expect(mockUseVehicleList).toHaveBeenCalledWith("owner-1");
  });

  /**
   * @test URLにownerIdが指定されていない場合は、従来通りログインユーザー自身の
   * 車両一覧を取得すること（undefinedが渡ること）を確認（デグレ防止）
   */
  test("URLにownerIdが無い場合はundefinedで車両一覧取得フックが呼ばれる", () => {
    render(<MaintenanceRecordRegisterContent />);

    expect(mockUseVehicleList).toHaveBeenCalledWith(undefined);
  });

  /**
   * @test 必須項目が未入力のまま送信した場合、登録処理が呼ばれないことを確認
   */
  test("必須項目未入力の場合はregisterMaintenanceRecordが呼ばれない", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(mockRegisterMaintenanceRecord).not.toHaveBeenCalled();
  });

  /**
   * @test 必須項目を全て入力して送信した場合、フォーム値がAPIリクエスト形式へ
   * 変換されてregisterMaintenanceRecordが呼ばれることを確認
   */
  test(
    "必須項目を入力して送信するとregisterMaintenanceRecordが呼ばれる",
    async () => {
      const user = userEvent.setup();
      render(<MaintenanceRecordRegisterContent />);

      await fillRequiredFieldsAndSubmit(user);

      expect(mockRegisterMaintenanceRecord).toHaveBeenCalledTimes(1);
      const [payload, images] = mockRegisterMaintenanceRecord.mock.calls[0];
      expect(payload).toMatchObject({
        vehicleId: "vehicle-1",
        title: "車検対応",
        maintenanceType: "VEHICLE_INSPECTION",
        workDateFrom: "2026-04-10",
        mileage: 70600,
        workItems: [
          {
            maintenanceCategory: "ENGINE",
            workContent: "エンジンオイル交換",
            performedBy: "ガレージ田中",
            laborCost: 2000,
            parts: [],
          },
        ],
      });
      expect(images.size).toBe(0);
    },
    // 対象車両・整備種別・作業カテゴリの3つのSelectを含む一連の入力操作のため、
    // 他テストと並列実行された際のCPU負荷次第でデフォルトタイムアウト（5000ms）を
    // 超える場合がある。操作数に見合うタイムアウトを個別に設定する。
    15000,
  );

  /**
   * @test 作業項目に整備画像を添付して送信すると、workItems配列インデックスをキーとした
   * Mapで画像ファイルが渡されることを確認
   */
  test(
    "整備画像を添付して送信すると画像ファイルがインデックス付きで渡される",
    async () => {
      const user = userEvent.setup();
      const { container } = render(<MaintenanceRecordRegisterContent />);

      await fillRequiredFields(user);

      const file = new File(["dummy"], "work.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]');
      await user.upload(input as HTMLInputElement, file);

      await user.click(screen.getByRole("button", { name: /保存/ }));

      expect(mockRegisterMaintenanceRecord).toHaveBeenCalledTimes(1);
      const [, images] = mockRegisterMaintenanceRecord.mock.calls[0];
      expect(images.get(0)).toBe(file);
    },
    // fillRequiredFieldsAndSubmitと同様、Select操作を複数含むため個別にタイムアウトを延長する
    15000,
  );

  /**
   * @test 「作業項目を追加」で作業項目が増え、削除ボタンで元に戻ることを確認
   */
  test("作業項目の追加・削除ができる", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    expect(screen.getByText("作業項目 1")).toBeInTheDocument();
    expect(screen.queryByText("作業項目 2")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /作業項目を追加/ }));

    expect(screen.getByText("作業項目 2")).toBeInTheDocument();

    // 2件になった状態でのみ「作業項目を削除」ボタンが表示される
    const removeButtons = screen.getAllByRole("button", {
      name: /作業項目を削除/,
    });
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[1]);

    expect(screen.queryByText("作業項目 2")).not.toBeInTheDocument();
  });

  /**
   * @test 「部品追加」で部品入力欄が増え、削除ボタンで減ることを確認
   */
  test("部品の追加・削除ができる", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    expect(screen.queryByText("部品名")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /部品追加/ }));

    expect(screen.getByText("部品名")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /この部品を削除/ }));

    expect(screen.queryByText("部品名")).not.toBeInTheDocument();
  });

  /**
   * @test 工賃・部品代の入力に応じて、フッターの合計金額表示が更新されることを確認
   */
  test("工賃・部品代の入力に応じて合計金額が更新される", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    expect(screen.getByText("¥0")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/工賃/), "2000");
    expect(await screen.findByText("¥2,000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /部品追加/ }));
    await user.type(screen.getByLabelText(/^数量/), "2");
    await user.type(screen.getByLabelText(/単価/), "1500");

    // 2000（工賃） + 2 × 1500（部品代） = 5000
    expect(await screen.findByText("¥5,000")).toBeInTheDocument();
  });

  /**
   * @test 未入力（変更なし）の状態でキャンセルした場合、確認ダイアログを出さずに
   * 即座に整備履歴一覧へ遷移することを確認
   */
  test("変更が無い状態でキャンセルすると確認無しで一覧へ遷移する", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    await user.click(screen.getByRole("button", { name: /キャンセル/ }));

    expect(
      screen.queryByText("入力内容を破棄しますか？"),
    ).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/maintenances");
  });

  /**
   * @test URLにreturnToが指定されている場合、キャンセル時に固定の一覧画面ではなく
   * returnToが示す元の絞り込み状態の一覧画面へ遷移することを確認
   */
  test("returnTo指定時はキャンセルでその戻り先へ遷移する", async () => {
    mockSearchParams = new URLSearchParams(
      "returnTo=%2Fmaintenances%3FvehicleId%3Dvehicle-1",
    );
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    await user.click(screen.getByRole("button", { name: /キャンセル/ }));

    expect(mockPush).toHaveBeenCalledWith("/maintenances?vehicleId=vehicle-1");
  });

  /**
   * @test 未保存の変更がある状態でキャンセルした場合、確認ダイアログが表示され、
   * その時点では遷移しないことを確認
   */
  test("変更がある状態でキャンセルすると確認ダイアログが表示される", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    await user.type(
      screen.getByPlaceholderText("例：車検対応、オイル交換"),
      "車検対応",
    );
    await user.click(screen.getByRole("button", { name: /キャンセル/ }));

    expect(
      await screen.findByText("入力内容を破棄しますか？"),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  /**
   * @test 確認ダイアログで「破棄する」を選択すると、整備履歴一覧へ遷移することを確認
   */
  test("確認ダイアログで破棄するを選択すると一覧へ遷移する", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    await user.type(
      screen.getByPlaceholderText("例：車検対応、オイル交換"),
      "車検対応",
    );
    await user.click(screen.getByRole("button", { name: /キャンセル/ }));
    await user.click(await screen.findByRole("button", { name: "破棄する" }));

    expect(mockPush).toHaveBeenCalledWith("/maintenances");
  });

  /**
   * @test 確認ダイアログで「キャンセル」を選択すると、遷移せず入力内容が保持されることを確認
   */
  test("確認ダイアログでキャンセルすると遷移せず入力内容が保持される", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordRegisterContent />);

    await user.type(
      screen.getByPlaceholderText("例：車検対応、オイル交換"),
      "車検対応",
    );
    await user.click(screen.getByRole("button", { name: /キャンセル/ }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "キャンセル" }));

    expect(
      screen.queryByText("入力内容を破棄しますか？"),
    ).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(
      screen.getByPlaceholderText("例：車検対応、オイル交換"),
    ).toHaveValue("車検対応");
  });
});
