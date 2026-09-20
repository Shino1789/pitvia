import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { ShopLinkModal } from "./shop-link-modal";
import { shopKeys } from "../constants/shop-keys";
import { queryClient } from "@/providers/query-provider";
import type { VehicleListResponse } from "@/features/vehicle/types/vehicle";

// API通信を担当するレイヤーをモック化
vi.mock("../api/shop-api", () => ({
  shopApi: { link: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

// 車両一覧取得フックのモック化用（車両選択肢の状態を各テストで切り替える）
let vehicleState: {
  data: VehicleListResponse | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};
const mockRefetchVehicles = vi.fn();

vi.mock("@/features/vehicle/hooks/use-vehicle-list", () => ({
  useVehicleList: () => vehicleState,
}));

/**
 * 車両一覧レスポンス（選択肢として使う項目のみ意味を持つ）を生成する
 */
function buildVehicleList(
  vehicles: { id: string; modelName: string; modelCode: string | null }[],
): VehicleListResponse {
  return {
    owner: null,
    vehicles: vehicles.map((v) => ({
      ...v,
      vehicleType: "CAR",
      manufacturerName: "NISSAN",
      engineCode: null,
      modelYear: 1990,
      licensePlate: null,
      imageUrl: null,
      currentMileage: 10000,
      transmissionType: "MT",
      driveType: "AWD",
      memo: null,
      canEdit: true,
    })),
  };
}

const VEHICLES = buildVehicleList([
  { id: "vehicle-1", modelName: "R32 GT-R", modelCode: "BNR32" },
  { id: "vehicle-2", modelName: "RX-7", modelCode: null },
]);

const LINKED = {
  shopId: "shop-1",
  shopName: "Advance Service Yokohama",
  vehicleId: "vehicle-1",
  status: "APPROVED",
  approvedAt: "2026-06-20T18:00:00Z",
};

/**
 * バックエンドの業務エラー（ErrorResponse形式）を持つAxiosErrorを生成する
 */
function buildApiError(status: number, code: string, message: string) {
  return new AxiosError("Request failed", String(status), undefined, undefined, {
    status,
    data: { meta: {}, error: { path: "/api/v1/shops/link", code, message } },
  } as AxiosResponse);
}

/**
 * useLinkShop（useMutation）がアプリ実体と同じ共有QueryClientシングルトンを使うため、
 * 同じインスタンスでラップしてレンダリングする
 */
function renderModal(onOpenChange = vi.fn()) {
  render(
    <QueryClientProvider client={queryClient}>
      <ShopLinkModal open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

/**
 * 対象車両を選択し、招待コードを入力する
 */
async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  vehicleLabel: string,
  code: string,
) {
  await user.click(screen.getByRole("combobox"));
  await user.click(screen.getByRole("option", { name: vehicleLabel }));
  await user.type(screen.getByPlaceholderText("例：ABCD-1234"), code);
}

/**
 * ShopLinkModal（ショップ連携モーダル）の単体テスト
 */
describe("ShopLinkModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vehicleState = {
      data: VEHICLES,
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicles,
    };
  });

  /**
   * @test モーダルのタイトル・説明文・入力欄・注意表示・ボタンが表示されることを確認
   */
  test("タイトル・説明文・入力欄・注意表示・ボタンが表示される", () => {
    renderModal();

    expect(screen.getByText("ショップ連携")).toBeInTheDocument();
    expect(
      screen.getByText(
        "ショップから発行された招待コードを入力して、連携を開始します。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("対象車両を選択")).toBeInTheDocument();
    expect(screen.getByText("招待コードを入力")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例：ABCD-1234")).toBeInTheDocument();
    expect(
      screen.getByText("ショップから受け取った招待コードを入力してください"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "連携が完了すると、この車両の整備履歴をショップと共有できます。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /連携する/ })).toBeEnabled();
  });

  /**
   * @test 車両の選択肢が「車名 型式」形式で表示されることを確認
   */
  test("車両の選択肢が車名と型式で表示される", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("combobox"));

    expect(
      screen.getByRole("option", { name: "R32 GT-R BNR32" }),
    ).toBeInTheDocument();
    // 型式が無い車両は車名のみ
    expect(screen.getByRole("option", { name: "RX-7" })).toBeInTheDocument();
  });

  /**
   * @test 小文字で入力しても大文字へ変換され、5文字目の入力でハイフンが付与されることを確認
   */
  test("小文字入力は大文字へ変換され、ハイフンが自動付与される", async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByPlaceholderText("例：ABCD-1234");

    await user.type(input, "xhvq");
    // 1ブロック目（4文字）を入力し終えた時点でハイフンが付与される
    expect(input).toHaveValue("XHVQ-");

    await user.type(input, "2xck");
    expect(input).toHaveValue("XHVQ-2XCK");
  });

  /**
   * @test 8文字（ハイフンを含め9文字）を超えて入力できないことを確認
   */
  test("XXXX-XXXXを超える文字数は入力できない", async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByPlaceholderText("例：ABCD-1234");

    await user.type(input, "XHVQ2XCKZZZ");

    expect(input).toHaveValue("XHVQ-2XCK");
  });

  /**
   * @test ショップ側でコピーした「XHVQ-2XCK」をそのままペーストしても、
   * 「XHVQ--2XCK」のようにハイフンが二重にならず、そのままAPIへ送信されることを確認
   */
  test("ハイフン付きコードのペーストでハイフンが二重にならない", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.link).mockResolvedValue(LINKED);
    renderModal();
    const input = screen.getByPlaceholderText("例：ABCD-1234");

    await user.click(input);
    await user.paste("XHVQ-2XCK");

    expect(input).toHaveValue("XHVQ-2XCK");

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "R32 GT-R BNR32" }));
    await user.click(screen.getByRole("button", { name: /連携する/ }));

    await waitFor(() => {
      expect(shopApi.link).toHaveBeenCalledWith({
        vehicleId: "vehicle-1",
        inviteCode: "XHVQ-2XCK",
      });
    });
  });

  /**
   * @test 前後に空白・改行が付いたペースト、小文字、ハイフン重複が混在していても正規化されることを確認
   */
  test("空白・小文字・ハイフン重複を含むペーストも正規化される", async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByPlaceholderText("例：ABCD-1234");

    await user.click(input);
    await user.paste("  xhvq--2xck \n");

    expect(input).toHaveValue("XHVQ-2XCK");
  });

  /**
   * @test 入力済みの値を全選択して別のコードをペーストすると、置き換えられることを確認
   */
  test("入力済みのコードを全選択して置き換えられる", async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByPlaceholderText("例：ABCD-1234");

    await user.click(input);
    await user.paste("XHVQ-2XCK");
    await user.tripleClick(input);
    await user.paste("abcd-3efg");

    expect(input).toHaveValue("ABCD-3EFG");
  });

  /**
   * @test Backspaceでハイフンごと削除していけること（ハイフンが再付与されて消せなくならない）を確認
   */
  test("Backspaceでハイフンを越えて削除できる", async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByPlaceholderText("例：ABCD-1234");

    await user.type(input, "XHVQ");
    expect(input).toHaveValue("XHVQ-");

    // ハイフンを削除しても再付与されない
    await user.type(input, "{Backspace}");
    expect(input).toHaveValue("XHVQ");

    await user.type(input, "{Backspace}");
    expect(input).toHaveValue("XHV");
  });

  /**
   * @test 未入力のまま送信すると必須エラーが表示され、APIを呼ばないことを確認
   */
  test("未入力で送信すると必須エラーが表示され、APIは呼ばれない", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    renderModal();

    await user.click(screen.getByRole("button", { name: /連携する/ }));

    expect(await screen.findByText("対象車両は必須です")).toBeInTheDocument();
    expect(screen.getByText("招待コードは必須です")).toBeInTheDocument();
    expect(shopApi.link).not.toHaveBeenCalled();
  });

  /**
   * @test 連携成功時、APIへ車両IDと（前後の空白を除いた）招待コードを送信し、
   * 成功トースト表示・一覧キャッシュ無効化・モーダルを閉じる処理が行われることを確認
   */
  test("連携成功時にトースト表示・一覧無効化・モーダルを閉じる", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.link).mockResolvedValue(LINKED);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { onOpenChange } = renderModal();

    await fillForm(user, "R32 GT-R BNR32", "  A7X9-K2LM ");
    await user.click(screen.getByRole("button", { name: /連携する/ }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(shopApi.link).toHaveBeenCalledWith({
      vehicleId: "vehicle-1",
      inviteCode: "A7X9-K2LM",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: shopKeys.lists() });
    expect(appToast.success).toHaveBeenCalledWith(
      "ショップとの連携が完了しました。",
    );
  });

  /**
   * @test 409 Conflict（既に連携済み）の場合、バックエンドのメッセージをフォーム上部に表示し、
   * モーダルを閉じず・成功トーストも表示しないことを確認
   */
  test("409エラー時はメッセージを表示し、モーダルは閉じない", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.link).mockRejectedValue(
      buildApiError(409, "SHOP_ALREADY_LINKED", "この車両は既にこのショップと連携済みです"),
    );
    const { onOpenChange } = renderModal();

    await fillForm(user, "R32 GT-R BNR32", "A7X9-K2LM");
    await user.click(screen.getByRole("button", { name: /連携する/ }));

    expect(
      await screen.findByText("この車両は既にこのショップと連携済みです"),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(appToast.success).not.toHaveBeenCalled();
    // 入力内容は保持され、修正して再試行できる
    expect(screen.getByPlaceholderText("例：ABCD-1234")).toHaveValue("A7X9-K2LM");
    expect(screen.getByRole("button", { name: /連携する/ })).toBeEnabled();
  });

  /**
   * @test 招待コードが無効（400）など、その他のAPIエラーもバックエンドのメッセージが表示されることを確認
   */
  test("招待コード無効エラー時もメッセージを表示する", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.link).mockRejectedValue(
      buildApiError(400, "INVALID_INVITE_CODE", "指定された招待コードは無効です"),
    );
    renderModal();

    await fillForm(user, "RX-7", "ZZZZ-0000");
    await user.click(screen.getByRole("button", { name: /連携する/ }));

    expect(
      await screen.findByText("指定された招待コードは無効です"),
    ).toBeInTheDocument();
  });

  /**
   * @test 連携中はボタンが無効化され二重送信できず、Escキーでも閉じられないことを確認
   */
  test("連携中は二重送信できず、モーダルも閉じられない", async () => {
    const user = userEvent.setup();
    const { shopApi } = await import("../api/shop-api");
    // 解決しないPromiseで「連携中」の状態を維持する
    vi.mocked(shopApi.link).mockReturnValue(new Promise(() => {}));
    const { onOpenChange } = renderModal();

    await fillForm(user, "R32 GT-R BNR32", "A7X9-K2LM");
    await user.click(screen.getByRole("button", { name: /連携する/ }));

    const submitting = await screen.findByRole("button", { name: /連携中/ });
    expect(submitting).toBeDisabled();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();

    // 連携中に再度クリックしても、APIは1回しか呼ばれない
    await user.click(submitting);
    expect(shopApi.link).toHaveBeenCalledTimes(1);

    // 連携中はEscキーでモーダルを閉じられない
    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  /**
   * @test キャンセルボタン押下でモーダルを閉じるコールバックが呼ばれることを確認
   */
  test("キャンセル押下でモーダルを閉じる", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /**
   * @test 車両一覧の取得中は、車両選択の代わりにローディング表示になり、連携操作ができないことを確認
   */
  test("車両一覧の取得中はローディング表示で連携できない", () => {
    vehicleState = {
      data: undefined,
      isPending: true,
      isError: false,
      refetch: mockRefetchVehicles,
    };

    renderModal();

    expect(
      document.body.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /連携する/ })).toBeDisabled();
  });

  /**
   * @test 車両が0台の場合、案内メッセージが表示され、連携操作ができないことを確認
   */
  test("車両が0台の場合は案内が表示され連携できない", () => {
    vehicleState = {
      data: buildVehicleList([]),
      isPending: false,
      isError: false,
      refetch: mockRefetchVehicles,
    };

    renderModal();

    expect(
      screen.getByText("連携できる車両がありません。先に車両を登録してください。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /連携する/ })).toBeDisabled();
  });

  /**
   * @test 車両一覧の取得に失敗した場合、エラー表示と再試行ボタンが表示され、連携操作ができないことを確認
   */
  test("車両一覧の取得失敗時はエラー表示と再試行ができる", async () => {
    const user = userEvent.setup();
    vehicleState = {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mockRefetchVehicles,
    };

    renderModal();

    expect(
      screen.getByText("車両一覧の取得に失敗しました。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /連携する/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "再試行" }));
    expect(mockRefetchVehicles).toHaveBeenCalledTimes(1);
  });
});
