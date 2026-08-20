import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useRegisterMaintenanceRecord } from "./use-register-maintenance-record";
import type { CreateMaintenanceRecordRequest } from "../types/maintenance-record";

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
  maintenanceRecordApi: { register: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const REQUEST: CreateMaintenanceRecordRequest = {
  vehicleId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
  title: "車検対応",
  maintenanceType: "VEHICLE_INSPECTION",
  workDateFrom: "2026-04-10",
  workDateTo: null,
  mileage: 70600,
  remarks: null,
  workItems: [
    {
      maintenanceCategory: "ENGINE",
      workContent: "エンジンオイル交換",
      performedBy: "ガレージ田中",
      laborCost: 2000,
      parts: [],
    },
  ],
};

/**
 * useRegisterMaintenanceRecord カスタムフックの単体テスト
 */
describe("useRegisterMaintenanceRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test 登録が成功した際、成功トーストを表示し、二重送信防止のためreplaceで
   * 整備履歴一覧へ遷移することを確認
   */
  test("登録成功時にトーストを表示し、整備履歴一覧へreplaceで遷移する", async () => {
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(maintenanceRecordApi.register).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegisterMaintenanceRecord());
    const images = new Map<number, File>([
      [0, new File(["dummy"], "work.png", { type: "image/png" })],
    ]);

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.registerMaintenanceRecord(REQUEST, images);
    });

    expect(maintenanceRecordApi.register).toHaveBeenCalledWith(REQUEST, images);
    expect(appToast.success).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/maintenances");
    expect(success).toBe(true);
    // 成功時はreplaceによる画面遷移直後のため、setIsLoading(false)は呼ばれない実装になっている
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  /**
   * @test redirectToを指定した場合、固定の整備履歴一覧ではなく指定した遷移先へ
   * replaceで遷移することを確認（車両ごとに絞り込んだ一覧から登録した場合の挙動）
   */
  test("redirectTo指定時はその遷移先へreplaceで遷移する", async () => {
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    vi.mocked(maintenanceRecordApi.register).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegisterMaintenanceRecord());

    await act(async () => {
      await result.current.registerMaintenanceRecord(
        REQUEST,
        new Map(),
        "/maintenances?vehicleId=vehicle-1",
      );
    });

    expect(mockReplace).toHaveBeenCalledWith(
      "/maintenances?vehicleId=vehicle-1",
    );
  });

  /**
   * @test 登録APIが失敗した際、エラーメッセージがstateにセットされ、
   * 画面遷移も成功トーストも発生しないことを確認
   */
  test("登録失敗時はエラーを保持し、遷移しない", async () => {
    const { maintenanceRecordApi } = await import("../api/maintenance-record-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(maintenanceRecordApi.register).mockRejectedValue(
      new Error("登録に失敗しました"),
    );

    const { result } = renderHook(() => useRegisterMaintenanceRecord());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.registerMaintenanceRecord(
        REQUEST,
        new Map(),
      );
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("登録に失敗しました");
    expect(result.current.isLoading).toBe(false);
    expect(appToast.success).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
