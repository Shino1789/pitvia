import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useUpdateVehicle } from "./use-update-vehicle";
import { vehicleKeys } from "../constants/vehicle-keys";
import type { UpdateVehicleRequest } from "../types/vehicle";

// API通信を担当するレイヤーをモック化
vi.mock("../api/vehicle-api", () => ({
  vehicleApi: { update: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const VEHICLE_ID = "vehicle-id-123";

const REQUEST: UpdateVehicleRequest = {
  vehicleType: "CAR",
  modelName: "RX-7",
  manufacturerId: 1,
  modelYear: 2002,
  currentMileage: 85000,
  transmissionType: "MT",
  driveType: "FR",
};

/**
 * useUpdateVehicle カスタムフックの単体テスト
 */
describe("useUpdateVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test 更新が成功した際、対象車両のキャッシュを無効化し、成功トーストを表示することを確認
   *
   * 更新成功時は画面遷移せず詳細画面に留まる設計のため、router関連の検証は行わない。
   */
  test("更新成功時に該当車両のキャッシュを無効化し、トーストを表示する", async () => {
    const { vehicleApi } = await import("../api/vehicle-api");
    const { appToast } = await import("@/lib/toast");
    const { queryClient } = await import("@/providers/query-provider");
    vi.mocked(vehicleApi.update).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateVehicle(VEHICLE_ID));
    const image = new File(["dummy"], "icon.png", { type: "image/png" });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.updateVehicle(REQUEST, image);
    });

    expect(vehicleApi.update).toHaveBeenCalledWith(VEHICLE_ID, REQUEST, image);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: vehicleKeys.detail(VEHICLE_ID),
    });
    expect(appToast.success).toHaveBeenCalled();
    expect(success).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  /**
   * @test 更新APIが失敗した際、エラーメッセージがstateにセットされ、
   * キャッシュ無効化・成功トーストが発生しないことを確認
   */
  test("更新失敗時はエラーを保持し、キャッシュを無効化しない", async () => {
    const { vehicleApi } = await import("../api/vehicle-api");
    const { appToast } = await import("@/lib/toast");
    const { queryClient } = await import("@/providers/query-provider");
    vi.mocked(vehicleApi.update).mockRejectedValue(
      new Error("更新に失敗しました"),
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateVehicle(VEHICLE_ID));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.updateVehicle(REQUEST, null);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("更新に失敗しました");
    expect(result.current.isLoading).toBe(false);
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(appToast.success).not.toHaveBeenCalled();
  });
});
