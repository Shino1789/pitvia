import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useDeleteVehicle } from "./use-delete-vehicle";

// ルーター移動を検証するためのモック関数
const mockReplace = vi.fn();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// API通信を担当するレイヤーをモック化
vi.mock("../api/vehicle-api", () => ({
  vehicleApi: { remove: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const VEHICLE_ID = "vehicle-id-123";

/**
 * useDeleteVehicle カスタムフックの単体テスト
 */
describe("useDeleteVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test 削除が成功した際、成功トーストを表示し、削除済み画面へ「戻る」で
   * 再到達できないようreplaceで車両一覧へ遷移することを確認
   */
  test("削除成功時にトーストを表示し、車両一覧へreplaceで遷移する", async () => {
    const { vehicleApi } = await import("../api/vehicle-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(vehicleApi.remove).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteVehicle(VEHICLE_ID));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.deleteVehicle();
    });

    expect(vehicleApi.remove).toHaveBeenCalledWith(VEHICLE_ID);
    expect(appToast.success).toHaveBeenCalled();
    expect(appToast.error).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/vehicles");
    expect(success).toBe(true);
  });

  /**
   * @test 削除APIが失敗した際、成功時と対称にトーストでエラーを通知し、
   * 画面遷移が発生しないことを確認
   */
  test("削除失敗時はエラートーストを表示し、遷移しない", async () => {
    const { vehicleApi } = await import("../api/vehicle-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(vehicleApi.remove).mockRejectedValue(
      new Error("削除に失敗しました"),
    );

    const { result } = renderHook(() => useDeleteVehicle(VEHICLE_ID));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.deleteVehicle();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("削除に失敗しました");
    expect(appToast.error).toHaveBeenCalledWith("削除に失敗しました");
    expect(appToast.success).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
