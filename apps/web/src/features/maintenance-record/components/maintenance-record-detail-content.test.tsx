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

// ヘッダータイトル制御フックをモック化（HeaderProvider無しで動作させる）
vi.mock("@/shared/hooks/use-header", () => ({
  useHeader: vi.fn(),
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
});
