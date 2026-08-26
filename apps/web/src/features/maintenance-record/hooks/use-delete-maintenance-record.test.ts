import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useDeleteMaintenanceRecord } from "./use-delete-maintenance-record";
import { maintenanceRecordKeys } from "../constants/maintenance-record-keys";

// ルーター移動を検証するためのモック関数
const mockReplace = vi.fn();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// API通信を担当するレイヤーをモック化
vi.mock("../api/maintenance-record-api", () => ({
  maintenanceRecordApi: { remove: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const MAINTENANCE_RECORD_ID = "record-id-123";

/**
 * useDeleteMaintenanceRecord カスタムフックの単体テスト
 */
describe("useDeleteMaintenanceRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test 削除が成功した際、整備履歴一覧キャッシュを無効化・詳細キャッシュを破棄したうえで
   * 成功トーストを表示し、削除済み画面へ「戻る」で再到達できないようreplaceで
   * 遷移先（デフォルトは整備履歴一覧）へ遷移することを確認
   */
  test("削除成功時に一覧キャッシュを無効化・詳細キャッシュを破棄し、既定の遷移先へreplaceで遷移する", async () => {
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    const { appToast } = await import("@/lib/toast");
    const { queryClient } = await import("@/providers/query-provider");
    vi.mocked(maintenanceRecordApi.remove).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const removeQueriesSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() =>
      useDeleteMaintenanceRecord(MAINTENANCE_RECORD_ID),
    );

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.deleteMaintenanceRecord();
    });

    expect(maintenanceRecordApi.remove).toHaveBeenCalledWith(
      MAINTENANCE_RECORD_ID,
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...maintenanceRecordKeys.all, "list"],
    });
    expect(removeQueriesSpy).toHaveBeenCalledWith({
      queryKey: maintenanceRecordKeys.detail(MAINTENANCE_RECORD_ID),
    });
    expect(appToast.success).toHaveBeenCalled();
    expect(appToast.error).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/maintenances");
    expect(success).toBe(true);
  });

  /**
   * @test redirectToを指定した場合、固定の整備履歴一覧ではなく指定した遷移先へ
   * replaceで遷移することを確認（車両ごとに絞り込んだ一覧から遷移してきた場合の挙動）
   */
  test("redirectTo指定時はその遷移先へreplaceで遷移する", async () => {
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    vi.mocked(maintenanceRecordApi.remove).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDeleteMaintenanceRecord(MAINTENANCE_RECORD_ID),
    );

    await act(async () => {
      await result.current.deleteMaintenanceRecord(
        "/maintenances?vehicleId=vehicle-1",
      );
    });

    expect(mockReplace).toHaveBeenCalledWith(
      "/maintenances?vehicleId=vehicle-1",
    );
  });

  /**
   * @test 削除APIが失敗した際、成功時と対称にトーストでエラーを通知し、
   * 画面遷移が発生しないことを確認
   */
  test("削除失敗時はエラートーストを表示し、遷移しない", async () => {
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(maintenanceRecordApi.remove).mockRejectedValue(
      new Error("削除に失敗しました"),
    );

    const { result } = renderHook(() =>
      useDeleteMaintenanceRecord(MAINTENANCE_RECORD_ID),
    );

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.deleteMaintenanceRecord();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("削除に失敗しました");
    expect(appToast.error).toHaveBeenCalledWith("削除に失敗しました");
    expect(appToast.success).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
