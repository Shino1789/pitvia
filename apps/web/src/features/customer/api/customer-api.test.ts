import { describe, test, expect, vi, beforeEach } from "vitest";
import { customerApi } from "./customer-api";

// axiosクライアントをモック化し、実際のHTTP通信は行わない
vi.mock("@/lib/api/axios", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

/**
 * customerApi（顧客系APIクライアント）の単体テスト
 */
describe("customerApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getList", () => {
    /**
     * @test /customersへ、keyword/page/sizeをクエリパラメータとしてGETリクエストすることを確認
     */
    test("keyword/page/sizeをクエリパラメータとして送信する", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { content: [], page: 1, size: 20, totalElements: 0, totalPages: 0 } },
      });

      await customerApi.getList({ keyword: "田中", page: 2, size: 20 });

      expect(apiClient.get).toHaveBeenCalledWith("/customers", {
        params: { keyword: "田中", page: 2, size: 20 },
      });
    });

    /**
     * @test パラメータ未指定の場合も/customersへリクエストできることを確認
     */
    test("パラメータ未指定でもリクエストできる", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { content: [], page: 1, size: 20, totalElements: 0, totalPages: 0 } },
      });

      await customerApi.getList({});

      expect(apiClient.get).toHaveBeenCalledWith("/customers", { params: {} });
    });
  });
});
