import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useUpdateMaintenanceRecord } from "./use-update-maintenance-record";
import { maintenanceRecordKeys } from "../constants/maintenance-record-keys";
import type { UpdateMaintenanceRecordRequest } from "../types/maintenance-record";

// API通信を担当するレイヤーをモック化
vi.mock("../api/maintenance-record-api", () => ({
  maintenanceRecordApi: { update: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const MAINTENANCE_RECORD_ID = "record-id-123";

const REQUEST: UpdateMaintenanceRecordRequest = {
  title: "車検対応",
  maintenanceType: "VEHICLE_INSPECTION",
  workDateFrom: "2026-04-10",
  workDateTo: null,
  mileage: 70600,
  remarks: null,
  workItems: [
    {
      id: 1,
      maintenanceCategory: "ENGINE",
      workContent: "エンジンオイル交換",
      performedBy: "ガレージ田中",
      laborCost: 2000,
      removeImage: false,
      parts: [],
    },
  ],
};

/**
 * useUpdateMaintenanceRecord カスタムフックの単体テスト
 */
describe("useUpdateMaintenanceRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test 更新が成功した際、対象整備履歴の詳細キャッシュ・一覧キャッシュの両方を無効化し、
   * 成功トーストを表示することを確認
   *
   * 一覧キャッシュは絞り込み条件ごとに多数キャッシュされ得るため、"list"配下を
   * まとめて無効化するプレフィックス指定になっていることを確認する（登録時と同じ方針）。
   */
  test("更新成功時に整備履歴詳細・一覧の両方のキャッシュを無効化し、トーストを表示する", async () => {
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    const { appToast } = await import("@/lib/toast");
    const { queryClient } = await import("@/providers/query-provider");
    vi.mocked(maintenanceRecordApi.update).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() =>
      useUpdateMaintenanceRecord(MAINTENANCE_RECORD_ID),
    );
    const images = new Map<number, File>([
      [0, new File(["dummy"], "work.png", { type: "image/png" })],
    ]);

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.updateMaintenanceRecord(REQUEST, images);
    });

    expect(maintenanceRecordApi.update).toHaveBeenCalledWith(
      MAINTENANCE_RECORD_ID,
      REQUEST,
      images,
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: maintenanceRecordKeys.detail(MAINTENANCE_RECORD_ID),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...maintenanceRecordKeys.all, "list"],
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
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    const { appToast } = await import("@/lib/toast");
    const { queryClient } = await import("@/providers/query-provider");
    vi.mocked(maintenanceRecordApi.update).mockRejectedValue(
      new Error("更新に失敗しました"),
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() =>
      useUpdateMaintenanceRecord(MAINTENANCE_RECORD_ID),
    );

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.updateMaintenanceRecord(
        REQUEST,
        new Map(),
      );
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("更新に失敗しました");
    expect(result.current.isLoading).toBe(false);
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(appToast.success).not.toHaveBeenCalled();
  });
});
