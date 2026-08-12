import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useRegisterVehicle } from "./use-register-vehicle";
import type { CreateVehicleRequest } from "../types/vehicle";

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
  vehicleApi: { register: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const REQUEST: CreateVehicleRequest = {
  vehicleType: "CAR",
  modelName: "RX-7",
  manufacturerId: 1,
  modelYear: 2002,
  currentMileage: 85000,
  transmissionType: "MT",
  driveType: "FR",
};

/**
 * useRegisterVehicle カスタムフックの単体テスト
 */
describe("useRegisterVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test 登録が成功した際、成功トーストを表示し、二重送信防止のためreplaceで
   * 車両一覧へ遷移することを確認
   */
  test("登録成功時にトーストを表示し、車両一覧へreplaceで遷移する", async () => {
    const { vehicleApi } = await import("../api/vehicle-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(vehicleApi.register).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegisterVehicle());
    const image = new File(["dummy"], "icon.png", { type: "image/png" });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.registerVehicle(REQUEST, image);
    });

    expect(vehicleApi.register).toHaveBeenCalledWith(REQUEST, image);
    expect(appToast.success).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/vehicles");
    expect(success).toBe(true);
    // 成功時はreplaceによる画面遷移直後のため、setIsLoading(false)は呼ばれない実装になっている
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  /**
   * @test 登録APIが失敗した際、エラーメッセージがstateにセットされ、
   * 画面遷移も成功トーストも発生しないことを確認
   */
  test("登録失敗時はエラーを保持し、遷移しない", async () => {
    const { vehicleApi } = await import("../api/vehicle-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(vehicleApi.register).mockRejectedValue(
      new Error("登録に失敗しました"),
    );

    const { result } = renderHook(() => useRegisterVehicle());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.registerVehicle(REQUEST, null);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("登録に失敗しました");
    expect(result.current.isLoading).toBe(false);
    expect(appToast.success).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
