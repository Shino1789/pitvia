import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { CustomerLinkedVehicles } from "./customer-linked-vehicles";
import type { CustomerVehicleSummary } from "../types/customer";

const VEHICLES: CustomerVehicleSummary[] = [
  { vehicleId: "v-1", vehicleName: "RX-7 (FD3S)", imageUrl: null },
  { vehicleId: "v-2", vehicleName: "GT-R (BNR34)", imageUrl: null },
];

/**
 * TooltipProviderは本番ではapp/layout.tsxが1つだけ提供する前提のため、
 * 単体テストではこのヘルパーで明示的にラップする（Providerが無いとRadixが例外を投げるため）。
 */
function renderWithTooltipProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

/**
 * CustomerLinkedVehicles（顧客カードの連携車両アイコン群）の単体テスト
 */
describe("CustomerLinkedVehicles", () => {
  /**
   * @test 連携車両が無い場合は「連携車両なし」と表示されることを確認
   */
  test("連携車両が0件の場合は「連携車両なし」と表示される", () => {
    renderWithTooltipProvider(
      <CustomerLinkedVehicles vehicles={[]} totalCount={0} />,
    );

    expect(screen.getByText("連携車両なし")).toBeInTheDocument();
  });

  /**
   * @test 連携車両が総数以下（3台以下）の場合、残数バッジが表示されないことを確認
   */
  test("連携車両が総数と一致する場合は残数バッジが表示されない", () => {
    renderWithTooltipProvider(
      <CustomerLinkedVehicles vehicles={VEHICLES} totalCount={2} />,
    );

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  /**
   * @test 連携車両が4台以上ある場合、「+N」（N = totalCount - 表示件数）が表示されることを確認
   */
  test("総数が表示件数より多い場合は残数が+N形式で表示される", () => {
    renderWithTooltipProvider(
      <CustomerLinkedVehicles vehicles={VEHICLES} totalCount={5} />,
    );

    // 表示は2件（VEHICLESの件数）のため、残数は 5 - 2 = 3
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  /**
   * @test 車両アイコンにカーソルを合わせると、Radix Tooltipで車両名が表示されることを確認
   */
  test("車両アイコンにカーソルを合わせるとTooltipで車両名が表示される", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTooltipProvider(
      <CustomerLinkedVehicles vehicles={VEHICLES} totalCount={2} />,
    );

    // Tooltip表示前は本文中に車両名テキストは存在しない
    expect(screen.queryByText("RX-7 (FD3S)")).not.toBeInTheDocument();

    // TooltipTrigger asChild によりAvatar Root自体がトリガー要素になっており、
    // data-slot属性はAvatar側の"avatar"ではなくTrigger側の"tooltip-trigger"に
    // 上書きされる（Radix Slotの仕様）ため、こちらで要素を取得する
    const [firstVehicleTrigger] = container.querySelectorAll(
      '[data-slot="tooltip-trigger"]',
    );
    await user.hover(firstVehicleTrigger);

    // Radixはtooltip内容を可視要素と、スクリーンリーダー向けの視覚的に隠れた要素の
    // 2箇所に同じテキストで描画するため、findByTextではなくfindAllByTextで検証する
    const matches = await screen.findAllByText("RX-7 (FD3S)");
    expect(matches.length).toBeGreaterThan(0);
  });
});
