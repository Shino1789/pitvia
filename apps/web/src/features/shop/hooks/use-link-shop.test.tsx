import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useLinkShop } from "./use-link-shop";
import { shopKeys } from "../constants/shop-keys";
import { queryClient } from "@/providers/query-provider";

// API通信を担当するレイヤーをモック化
vi.mock("../api/shop-api", () => ({
  shopApi: { link: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const REQUEST = { vehicleId: "vehicle-1", inviteCode: "A7X9-K2LM" };

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
 * useMutationはQueryClientProviderのContextを必要とするため、アプリ実体と同じ
 * 共有QueryClientシングルトンでラップする
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * useLinkShop カスタムフックの単体テスト
 */
describe("useLinkShop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  /**
   * @test 連携が成功した際、ショップ一覧キャッシュを無効化し、成功トーストを表示することを確認
   */
  test("連携成功時に一覧キャッシュを無効化し、成功トーストを表示する", async () => {
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.link).mockResolvedValue(LINKED);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useLinkShop(), { wrapper });

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.linkShop(REQUEST);
    });

    expect(succeeded).toBe(true);
    expect(shopApi.link).toHaveBeenCalledWith(REQUEST);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: shopKeys.lists() });
    expect(appToast.success).toHaveBeenCalledWith(
      "ショップとの連携が完了しました。",
    );
    expect(result.current.error).toBeNull();
  });

  /**
   * @test 連携APIが業務エラー（409等）を返した際、例外を投げずfalseを返し、
   * バックエンドのエラーメッセージを保持することを確認（成功トースト・キャッシュ無効化は行わない）
   */
  test("連携失敗時はfalseを返し、APIのエラーメッセージを保持する", async () => {
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.link).mockRejectedValue(
      buildApiError(409, "SHOP_ALREADY_LINKED", "このショップとは既に連携済みです"),
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useLinkShop(), { wrapper });

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.linkShop(REQUEST);
    });

    expect(succeeded).toBe(false);
    await waitFor(() => {
      expect(result.current.error).toBe("このショップとは既に連携済みです");
    });
    expect(result.current.isLoading).toBe(false);
    expect(appToast.success).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  /**
   * @test reset()でエラー状態がクリアされることを確認
   */
  test("reset()でエラーメッセージがクリアされる", async () => {
    const { shopApi } = await import("../api/shop-api");
    vi.mocked(shopApi.link).mockRejectedValue(
      buildApiError(400, "INVALID_INVITE_CODE", "指定された招待コードは無効です"),
    );

    const { result } = renderHook(() => useLinkShop(), { wrapper });

    await act(async () => {
      await result.current.linkShop(REQUEST);
    });
    await waitFor(() => {
      expect(result.current.error).toBe("指定された招待コードは無効です");
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
