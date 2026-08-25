import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { MaintenanceRecordDetailContent } from "./maintenance-record-detail-content";

// ルーター移動を検証するためのモック関数
const mockPush = vi.fn();
// URLクエリパラメータ（returnTo/ownerId）を制御するためのモック用変数
let mockSearchParams = new URLSearchParams();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({ maintenanceRecordId: "record-id-123" }),
  useSearchParams: () => mockSearchParams,
}));

// ヘッダータイトル制御フックをモック化（HeaderProvider無しで動作させる。
// 呼び出し引数（タイトル文字列）を検証できるようspyにする）
const mockUseHeader = vi.fn();
vi.mock("@/shared/hooks/use-header", () => ({
  useHeader: (args: unknown) => mockUseHeader(args),
}));

// 車両一覧取得フックのモック化用関数（ヘッダーへの対象オーナー名表示にのみ使用）
let vehicleListState: { data: unknown };
const mockUseVehicleList = vi.fn<(ownerId?: string) => typeof vehicleListState>(
  () => vehicleListState,
);
vi.mock("@/features/vehicle/hooks/use-vehicle-list", () => ({
  useVehicleList: (ownerId?: string) => mockUseVehicleList(ownerId),
}));

// 整備履歴詳細取得フックのモック化用関数
const mockRefetchRecord = vi.fn();
let recordState: {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  refetch: typeof mockRefetchRecord;
};
vi.mock("../hooks/use-maintenance-record-detail", () => ({
  useMaintenanceRecordDetail: () => recordState,
}));

// 整備履歴更新処理フックのモック化
const mockUpdateMaintenanceRecord = vi.fn();
vi.mock("../hooks/use-update-maintenance-record", () => ({
  useUpdateMaintenanceRecord: () => ({
    updateMaintenanceRecord: mockUpdateMaintenanceRecord,
    isLoading: false,
    error: null,
  }),
}));

// 整備履歴削除処理フックのモック化
const mockDeleteMaintenanceRecord = vi.fn();
vi.mock("../hooks/use-delete-maintenance-record", () => ({
  useDeleteMaintenanceRecord: () => ({
    deleteMaintenanceRecord: mockDeleteMaintenanceRecord,
    isLoading: false,
    error: null,
  }),
}));

const TITLE_PLACEHOLDER = "例：車検対応、オイル交換";

/** テスト用の整備履歴詳細データ（登録者本人・canEdit=true） */
const RECORD = {
  id: "record-id-123",
  vehicleId: "vehicle-1",
  vehicleModelName: "GT-R",
  vehicleModelCode: "R32",
  title: "車検対応",
  maintenanceType: "VEHICLE_INSPECTION",
  workDateFrom: "2026-04-10",
  workDateTo: "2026-04-10",
  mileage: 70600,
  remarks: null,
  shopName: null,
  workItems: [
    {
      id: 1,
      maintenanceCategory: "ENGINE",
      workContent: "エンジンオイル交換",
      performedBy: "山岸 大地",
      laborCost: 2000,
      imageUrl: null,
      parts: [],
    },
  ],
  canEdit: true,
};

/**
 * MaintenanceRecordDetailContent（整備履歴詳細・更新画面）の単体テスト
 */
describe("MaintenanceRecordDetailContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vehicleListState = { data: { owner: null, vehicles: [] } };
    recordState = {
      data: RECORD,
      isPending: false,
      isError: false,
      refetch: mockRefetchRecord,
    };
  });

  /**
   * @test データ取得中はスケルトンUIが表示されることを確認
   */
  test("データ取得中はスケルトンUIを表示する", () => {
    recordState = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch: mockRefetchRecord,
    };

    const { container } = render(<MaintenanceRecordDetailContent />);

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  /**
   * @test データ取得に失敗した場合、エラー表示に切り替わりrefetchが呼ばれることを確認
   */
  test("データ取得に失敗した場合はエラー表示に切り替わる", async () => {
    const user = userEvent.setup();
    recordState = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mockRefetchRecord,
    };

    render(<MaintenanceRecordDetailContent />);

    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /再試行/ }));
    expect(mockRefetchRecord).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 初期表示は閲覧モードであり、入力欄ではなく読み取り専用テキストで表示されることを確認
   */
  test("初期表示は閲覧モードで、フィールドは読み取り専用テキスト表示になる", () => {
    render(<MaintenanceRecordDetailContent />);

    expect(screen.getByText("車検対応")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(TITLE_PLACEHOLDER)).not.toBeInTheDocument();
    // 閲覧モードのフッターは「キャンセル」のみ
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /保存/ })).not.toBeInTheDocument();
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
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(mockPush).toHaveBeenCalledWith("/maintenances?vehicleId=vehicle-1");
  });

  /**
   * @test URLにownerIdが指定されている場合、useVehicleListへ渡され、その結果得られる
   * 対象オーナー名がヘッダータイトルへ反映されることを確認（顧客の履歴を操作している
   * ことが分かるようにするための対応）
   */
  test("URLのownerIdから対象オーナー名を取得しヘッダータイトルへ反映する", () => {
    mockSearchParams = new URLSearchParams("ownerId=owner-1");
    vehicleListState = {
      data: { owner: { id: "owner-1", userName: "田中 健太" }, vehicles: [] },
    };

    render(<MaintenanceRecordDetailContent />);

    expect(mockUseVehicleList).toHaveBeenCalledWith("owner-1");
    expect(mockUseHeader).toHaveBeenCalledWith(
      expect.objectContaining({ title: "田中 健太 様の整備履歴詳細" }),
    );
  });

  /**
   * @test URLにownerIdが無い場合（自分自身の整備履歴）は、従来通り固定タイトルの
   * ままであることを確認（デグレ防止）
   */
  test("URLにownerIdが無い場合は固定タイトルのまま", () => {
    render(<MaintenanceRecordDetailContent />);

    expect(mockUseVehicleList).toHaveBeenCalledWith(undefined);
    expect(mockUseHeader).toHaveBeenCalledWith(
      expect.objectContaining({ title: "整備履歴詳細" }),
    );
  });

  /**
   * @test 登録者本人（canEdit=true）の場合、モード切り替えUIが表示され、
   * 編集モードへ切り替えると入力欄・削除/保存ボタンが表示されることを確認
   */
  test("canEdit=trueの場合、編集モードへ切り替えると入力欄と削除・保存ボタンが表示される", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));

    expect(screen.getByPlaceholderText(TITLE_PLACEHOLDER)).toHaveValue(
      "車検対応",
    );
    expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保存/ })).toBeInTheDocument();
  });

  /**
   * @test 登録者本人ではない（canEdit=false）場合、モード切り替えUI自体が表示されず、
   * 常に閲覧モードのフッター（キャンセルのみ）になることを確認
   */
  test("canEdit=falseの場合、モード切り替えUIが表示されず編集不可になる", () => {
    recordState = {
      data: { ...RECORD, canEdit: false },
      isPending: false,
      isError: false,
      refetch: mockRefetchRecord,
    };

    render(<MaintenanceRecordDetailContent />);

    expect(
      screen.queryByRole("button", { name: "編集モード" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(TITLE_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument();
  });

  /**
   * @test 編集モードで保存すると、変換済みデータ（workItemIdを含む）でupdateMaintenanceRecordが
   * 呼ばれ、成功後は閲覧モードへ戻ることを確認
   */
  test("編集モードで保存するとupdateMaintenanceRecordが呼ばれ閲覧モードへ戻る", async () => {
    const user = userEvent.setup();
    mockUpdateMaintenanceRecord.mockResolvedValue(true);
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.clear(screen.getByPlaceholderText(TITLE_PLACEHOLDER));
    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), "車検対応（更新後）");
    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(mockUpdateMaintenanceRecord).toHaveBeenCalledTimes(1);
    const [payload] = mockUpdateMaintenanceRecord.mock.calls[0];
    expect(payload).toMatchObject({
      title: "車検対応（更新後）",
      maintenanceType: "VEHICLE_INSPECTION",
      workItems: [expect.objectContaining({ id: 1, removeImage: false })],
    });

    expect(
      screen.queryByPlaceholderText(TITLE_PLACEHOLDER),
    ).not.toBeInTheDocument();
    expect(screen.getByText("車検対応（更新後）")).toBeInTheDocument();
  });

  /**
   * @test 編集モードで未保存の変更がある状態から閲覧モードへ戻ろうとすると、
   * 確認ダイアログが表示されることを確認
   */
  test("編集モードで変更がある状態から閲覧モードへ切り替えると確認ダイアログが表示される", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.clear(screen.getByPlaceholderText(TITLE_PLACEHOLDER));
    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), "変更後タイトル");

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
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.clear(screen.getByPlaceholderText(TITLE_PLACEHOLDER));
    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), "変更後タイトル");
    await user.click(screen.getByRole("button", { name: "閲覧モード" }));

    await user.click(await screen.findByRole("button", { name: "破棄する" }));

    expect(screen.queryByPlaceholderText(TITLE_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.getByText("車検対応")).toBeInTheDocument();
  });

  /**
   * @test 作業項目を削除しても、残りの作業項目の画像が誤表示されないことを確認
   * （作業項目のサーバー側ID経由で元画像を参照しているため、配列インデックスの
   * ずれの影響を受けない）
   */
  test("作業項目削除後も残りの作業項目の画像が正しいまま表示される", async () => {
    const user = userEvent.setup();
    recordState = {
      data: {
        ...RECORD,
        workItems: [
          { ...RECORD.workItems[0], id: 1, imageUrl: null },
          {
            ...RECORD.workItems[0],
            id: 2,
            imageUrl: "https://example.com/work-2.jpg",
          },
        ],
      },
      isPending: false,
      isError: false,
      refetch: mockRefetchRecord,
    };
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    // 作業項目1（画像なし）を削除する
    await user.click(
      screen.getAllByRole("button", { name: /作業項目を削除/ })[0],
    );

    // 残った作業項目（元は作業項目2）の画像が引き続き正しく表示されること
    const image = screen.getByAltText("整備画像プレビュー");
    expect(image).toHaveAttribute("src", "https://example.com/work-2.jpg");
  });

  /**
   * @test 既存画像の削除ボタンを押すと、フォールバックで元画像へ復活せず
   * 非表示のまま維持されることを確認
   */
  test("既存画像の削除ボタン押下後は元画像が復活しない", async () => {
    const user = userEvent.setup();
    recordState = {
      data: {
        ...RECORD,
        workItems: [
          { ...RECORD.workItems[0], imageUrl: "https://example.com/work-1.jpg" },
        ],
      },
      isPending: false,
      isError: false,
      refetch: mockRefetchRecord,
    };
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    expect(screen.getByAltText("整備画像プレビュー")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "画像を削除" }));

    expect(screen.queryByAltText("整備画像プレビュー")).not.toBeInTheDocument();
  });

  /**
   * @test 画像を差し替えて保存すると、その後編集モードへ再度入っても
   * 未保存の画像変更として誤検出されず、確認ダイアログが出ないことを確認
   */
  test("画像差し替え後に保存すると、再度編集モードに入っても未保存扱いにならない", async () => {
    const user = userEvent.setup();
    mockUpdateMaintenanceRecord.mockResolvedValue(true);
    const { container } = render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));

    const file = new File(["dummy"], "work.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    await user.upload(input as HTMLInputElement, file);

    await user.click(screen.getByRole("button", { name: /保存/ }));
    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.click(screen.getByRole("button", { name: "閲覧モード" }));

    // 直前の保存内容はクリア済みのため、破棄確認ダイアログは表示されない
    expect(
      screen.queryByText("編集内容を破棄しますか？"),
    ).not.toBeInTheDocument();
  });

  /**
   * @test 編集モードで削除ボタンを押すと削除確認ダイアログが表示され、
   * 「削除する」を選択するとdeleteMaintenanceRecordが呼ばれることを確認
   */
  test("削除ボタン押下→確認で削除処理が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    await user.click(screen.getByRole("button", { name: "削除" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("この整備履歴を削除しますか？"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "削除する" }));

    expect(mockDeleteMaintenanceRecord).toHaveBeenCalledTimes(1);
  });
});
