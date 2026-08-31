import { describe, test, expect, vi, beforeEach } from "vitest";
import { vehicleApi } from "./vehicle-api";
import type { CreateVehicleRequest } from "../types/vehicle";

// axiosクライアントをモック化し、実際のHTTP通信は行わない
vi.mock("@/lib/api/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const CREATE_REQUEST: CreateVehicleRequest = {
  vehicleType: "CAR",
  modelName: "RX-7",
  manufacturerId: 1,
  modelCode: "FD3S",
  engineCode: "13B-REW",
  modelYear: 2002,
  licensePlate: "品川 300 な 77-77",
  currentMileage: 85000,
  transmissionType: "MT",
  driveType: "FR",
  memo: "オーナーのメイン車両",
};

/**
 * vehicleApi（車両系APIクライアント）の単体テスト
 *
 * 主に、リクエストDTOと画像ファイルからmultipart/form-dataのFormDataを正しく
 * 組み立てられているか、および各エンドポイント・パラメータが正しいかを検証する。
 */
describe("vehicleApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getList", () => {
    /**
     * @test ownerId未指定の場合、パラメータ無しで/vehiclesへGETリクエストすることを確認
     */
    test("ownerId未指定の場合、パラメータ無しでリクエストする", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { owner: null, vehicles: [] } },
      });

      await vehicleApi.getList();

      expect(apiClient.get).toHaveBeenCalledWith("/vehicles", {
        params: undefined,
      });
    });

    /**
     * @test ownerId指定の場合、クエリパラメータとして付与されることを確認
     */
    test("ownerId指定の場合、クエリパラメータとして送信する", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { owner: null, vehicles: [] } },
      });

      await vehicleApi.getList("owner-id-123");

      expect(apiClient.get).toHaveBeenCalledWith("/vehicles", {
        params: { ownerId: "owner-id-123" },
      });
    });
  });

  describe("getFormOptions", () => {
    /**
     * @test form-optionsエンドポイントへ、車両種別をクエリパラメータとして呼び出すことを確認
     */
    test("form-optionsエンドポイントをvehicleTypeパラメータ付きで呼び出す", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { manufacturers: [], transmissionTypes: [], driveTypes: [] } },
      });

      await vehicleApi.getFormOptions("CAR");

      expect(apiClient.get).toHaveBeenCalledWith("/vehicles/form-options", {
        params: { vehicleType: "CAR" },
      });
    });
  });

  describe("register", () => {
    /**
     * @test 画像ファイルが指定された場合、request（JSON）とfile（画像）の2パートを持つ
     * FormDataが/vehiclesへPOSTされることを確認
     */
    test("画像ありの場合、request・fileの2パートを含むFormDataを送信する", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.post).mockResolvedValue({});
      const image = new File(["dummy"], "icon.png", { type: "image/png" });

      await vehicleApi.register(CREATE_REQUEST, image);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      const [url, formData] = vi.mocked(apiClient.post).mock.calls[0];
      expect(url).toBe("/vehicles");
      expect(formData).toBeInstanceOf(FormData);

      const sentFormData = formData as FormData;
      const requestPart = sentFormData.get("request") as Blob;
      expect(requestPart.type).toBe("application/json");
      expect(await requestPart.text()).toBe(JSON.stringify(CREATE_REQUEST));
      expect(sentFormData.get("file")).toBe(image);
    });

    /**
     * @test 画像ファイルが未指定の場合、fileパートを含まないFormDataが送信されることを確認
     */
    test("画像なしの場合、fileパートを含まないFormDataを送信する", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.post).mockResolvedValue({});

      await vehicleApi.register(CREATE_REQUEST, null);

      const [, formData] = vi.mocked(apiClient.post).mock.calls[0];
      const sentFormData = formData as FormData;
      expect(sentFormData.get("file")).toBeNull();
      expect(sentFormData.get("request")).not.toBeNull();
    });
  });

  describe("getDetail", () => {
    /**
     * @test 車両IDを含むURLへGETリクエストすることを確認
     */
    test("車両IDを含むURLへGETリクエストする", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: {} } });

      await vehicleApi.getDetail("vehicle-id-123");

      expect(apiClient.get).toHaveBeenCalledWith("/vehicles/vehicle-id-123");
    });
  });

  describe("update", () => {
    /**
     * @test 車両IDを含むURLへ、FormData形式でPUTリクエストすることを確認
     */
    test("車両IDを含むURLへFormData形式でPUTリクエストする", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.put).mockResolvedValue({});

      await vehicleApi.update("vehicle-id-123", CREATE_REQUEST, null);

      expect(apiClient.put).toHaveBeenCalledTimes(1);
      const [url, formData] = vi.mocked(apiClient.put).mock.calls[0];
      expect(url).toBe("/vehicles/vehicle-id-123");
      expect(formData).toBeInstanceOf(FormData);
    });
  });

  describe("remove", () => {
    /**
     * @test 車両IDを含むURLへDELETEリクエストすることを確認
     */
    test("車両IDを含むURLへDELETEリクエストする", async () => {
      const { apiClient } = await import("@/lib/api/axios");
      vi.mocked(apiClient.delete).mockResolvedValue({});

      await vehicleApi.remove("vehicle-id-123");

      expect(apiClient.delete).toHaveBeenCalledWith("/vehicles/vehicle-id-123");
    });
  });
});
