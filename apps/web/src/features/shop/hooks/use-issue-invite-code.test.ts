import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useIssueInviteCode } from "./use-issue-invite-code";
import { shopKeys } from "../constants/shop-keys";
import type { ShopInviteCode } from "../types/shop";

// API通信を担当するレイヤーをモック化
vi.mock("../api/shop-api", () => ({
  shopApi: { issueInviteCode: vi.fn() },
}));

// トースト通知をモック化
vi.mock("@/lib/toast", () => ({
  appToast: { success: vi.fn(), error: vi.fn() },
}));

const NEW_CODE: ShopInviteCode = {
  code: "A7X9-K2LM",
  expiresAt: "2026-06-20T18:00:00Z",
};

/**
 * useIssueInviteCode カスタムフックの単体テスト
 */
describe("useIssueInviteCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * @test 発行が成功した際、招待コードのキャッシュへ即時反映し、成功トーストを表示することを確認
   */
  test("発行成功時にキャッシュを更新し、成功トーストを表示する", async () => {
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    const { queryClient } = await import("@/providers/query-provider");
    vi.mocked(shopApi.issueInviteCode).mockResolvedValue(NEW_CODE);
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

    const { result } = renderHook(() => useIssueInviteCode());

    let response: ShopInviteCode | null = null;
    await act(async () => {
      response = await result.current.issueInviteCode();
    });

    expect(shopApi.issueInviteCode).toHaveBeenCalledTimes(1);
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      shopKeys.inviteCode(),
      NEW_CODE,
    );
    expect(appToast.success).toHaveBeenCalledWith("招待コードを発行しました。");
    expect(response).toEqual(NEW_CODE);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  /**
   * @test 発行APIが失敗した際、エラーメッセージを保持し、エラートーストを表示することを確認
   */
  test("発行失敗時はエラーを保持し、エラートーストを表示する", async () => {
    const { shopApi } = await import("../api/shop-api");
    const { appToast } = await import("@/lib/toast");
    vi.mocked(shopApi.issueInviteCode).mockRejectedValue(
      new Error("発行に失敗しました"),
    );

    const { result } = renderHook(() => useIssueInviteCode());

    let response: ShopInviteCode | null = null;
    await act(async () => {
      response = await result.current.issueInviteCode();
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe("発行に失敗しました");
    expect(result.current.isLoading).toBe(false);
    expect(appToast.error).toHaveBeenCalledWith("発行に失敗しました");
    expect(appToast.success).not.toHaveBeenCalled();
  });
});
