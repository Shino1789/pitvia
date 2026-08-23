import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  MaintenanceRecordDetailContent,
  MOCK_MAINTENANCE_RECORD_DETAIL,
} from "./maintenance-record-detail-content";

// ルーター移動を検証するためのモック関数
const mockPush = vi.fn();
// URLクエリパラメータ（returnTo）を制御するためのモック用変数
let mockSearchParams = new URLSearchParams();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

const TITLE_PLACEHOLDER = "例：車検対応、オイル交換";

/**
 * MaintenanceRecordDetailContent（整備履歴詳細・更新画面）の単体テスト
 *
 * 詳細取得APIが未実装のため、モックデータ（props経由で注入可能）を用いた
 * 閲覧/編集モード切り替え・登録者本人のみ編集可能なUIの検証に主眼を置く。
 */
describe("MaintenanceRecordDetailContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vehicleListState = { data: { owner: null, vehicles: [] } };
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
    render(
      <MaintenanceRecordDetailContent
        record={{ ...MOCK_MAINTENANCE_RECORD_DETAIL, canEdit: false }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "編集モード" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(TITLE_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument();
  });

  /**
   * @test 編集モードで保存すると、更新APIは未実装のため実際の送信は行わず、
   * 閲覧モードへ戻ることを確認
   */
  test("編集モードで保存すると閲覧モードへ戻る", async () => {
    const user = userEvent.setup();
    render(<MaintenanceRecordDetailContent />);

    await user.click(screen.getByRole("button", { name: "編集モード" }));
    expect(screen.getByPlaceholderText(TITLE_PLACEHOLDER)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /保存/ }));

    expect(
      screen.queryByPlaceholderText(TITLE_PLACEHOLDER),
    ).not.toBeInTheDocument();
    expect(screen.getByText("車検対応")).toBeInTheDocument();
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
   * @test 作業項目を削除しても、残りの作業項目の画像がインデックスのずれにより
   * 誤表示されないことを確認（fieldId単位で画像状態を紐付けているため）
   */
  test("作業項目削除後も残りの作業項目の画像が正しいまま表示される", async () => {
    const user = userEvent.setup();
    const record = {
      ...MOCK_MAINTENANCE_RECORD_DETAIL,
      workItems: [
        { ...MOCK_MAINTENANCE_RECORD_DETAIL.workItems[0], id: 1, imageUrl: null },
        {
          ...MOCK_MAINTENANCE_RECORD_DETAIL.workItems[0],
          id: 2,
          imageUrl: "https://example.com/work-2.jpg",
        },
      ],
    };
    render(<MaintenanceRecordDetailContent record={record} />);

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
    const record = {
      ...MOCK_MAINTENANCE_RECORD_DETAIL,
      workItems: [
        {
          ...MOCK_MAINTENANCE_RECORD_DETAIL.workItems[0],
          imageUrl: "https://example.com/work-1.jpg",
        },
      ],
    };
    render(<MaintenanceRecordDetailContent record={record} />);

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
});
