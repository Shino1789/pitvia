import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { VehicleFilterSelect } from "./maintenance-record-vehicle-filter";

// 車両一覧取得フックのモック化用関数
let vehicleListState: { data: unknown; isPending: boolean };
const mockUseVehicleList = vi.fn((_ownerId?: string) => vehicleListState);

vi.mock("@/features/vehicle/hooks/use-vehicle-list", () => ({
  useVehicleList: (ownerId?: string) => mockUseVehicleList(ownerId),
}));

const VEHICLE_LIST_RESPONSE = {
  owner: null,
  vehicles: [
    { id: "vehicle-1", modelName: "RX-7", modelCode: "FD3S" },
    { id: "vehicle-2", modelName: "GT-R", modelCode: null },
  ],
};

/**
 * VehicleFilterSelect（整備履歴一覧の車両絞り込みプルダウン）の単体テスト
 */
describe("VehicleFilterSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleListState = { data: VEHICLE_LIST_RESPONSE, isPending: false };
  });

  /**
   * @test 車両一覧取得フックへ、propsで受け取ったownerIdをそのまま渡すことを確認
   * （URLの生のownerIdではなく、呼び出し元が解決した値を信頼する設計）
   */
  test("propsのownerIdをそのまま車両一覧取得フックへ渡す", () => {
    render(
      <VehicleFilterSelect ownerId="owner-1" value={undefined} onChange={vi.fn()} />,
    );

    expect(mockUseVehicleList).toHaveBeenCalledWith("owner-1");
  });

  /**
   * @test valueが未指定の場合、「すべて」が選択表示されることを確認
   */
  test("valueが未指定の場合は「すべて」が表示される", () => {
    render(
      <VehicleFilterSelect ownerId={undefined} value={undefined} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("すべて");
  });

  /**
   * @test valueに車両IDが指定されている場合、対応する車両名が選択表示されることを確認
   */
  test("valueに車両IDが指定されている場合はその車両名が表示される", () => {
    render(
      <VehicleFilterSelect
        ownerId={undefined}
        value="vehicle-1"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("RX-7 FD3S");
  });

  /**
   * @test 車両を選択すると、その車両IDでonChangeが呼ばれることを確認
   */
  test("車両を選択するとその車両IDでonChangeが呼ばれる", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VehicleFilterSelect ownerId={undefined} value={undefined} onChange={onChange} />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "RX-7 FD3S" }));

    expect(onChange).toHaveBeenCalledWith("vehicle-1");
  });

  /**
   * @test 車両選択中に「すべて」を選択すると、undefinedでonChangeが呼ばれることを確認
   */
  test("「すべて」を選択するとundefinedでonChangeが呼ばれる", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VehicleFilterSelect
        ownerId={undefined}
        value="vehicle-1"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "すべて" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  /**
   * @test 車両一覧取得中はSelectが操作不可になることを確認
   */
  test("車両一覧取得中はSelectが無効化される", () => {
    vehicleListState = { data: undefined, isPending: true };

    render(
      <VehicleFilterSelect ownerId={undefined} value={undefined} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
