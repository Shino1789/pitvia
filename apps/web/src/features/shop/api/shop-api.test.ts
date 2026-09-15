import { describe, test, expect, vi, beforeEach } from "vitest";
import { shopApi } from "./shop-api";

// axiosクライアントをモック化し、実際のHTTP通信は行わない
vi.mock("@/lib/api/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

/**
 * shopApi（ショップ系APIクライアント）の単体テスト
 */
describe("shopApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInviteCode", () => {
    /**
     * @test /shops/invite-codeへGETリクエストし、レスポンスのdataをそのまま返すことを確認
     */
    test("GETリクエストを行い、dataを返す", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      const code = { code: "A7X9-K2LM", expiresAt: "2026-06-20T18:00:00Z" };
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: code } });

      const result = await shopApi.getInviteCode();

      expect(apiClient.get).toHaveBeenCalledWith("/shops/invite-code");
      expect(result).toEqual(code);
    });

    /**
     * @test 有効なコードが存在しない場合、dataがnullのまま返ることを確認
     */
    test("有効なコードが存在しない場合はnullを返す", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: null } });

      const result = await shopApi.getInviteCode();

      expect(result).toBeNull();
    });
  });

  describe("issueInviteCode", () => {
    /**
     * @test /shops/invite-codeへPOSTリクエストし、レスポンスのdataをそのまま返すことを確認
     */
    test("POSTリクエストを行い、新しい招待コードを返す", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      const code = { code: "B2Y8-Q9NP", expiresAt: "2026-06-21T18:00:00Z" };
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: code } });

      const result = await shopApi.issueInviteCode();

      expect(apiClient.post).toHaveBeenCalledWith("/shops/invite-code");
      expect(result).toEqual(code);
    });
  });
});
