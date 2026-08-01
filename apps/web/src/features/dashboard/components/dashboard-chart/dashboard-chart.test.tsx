import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { DashboardChart } from "./dashboard-chart";
import type { DashboardChartResponse } from "../../types/dashboard";
import { PERIOD_TYPE } from "@/shared/constants/period";
import { DASHBOARD_CHART_TYPE } from "../../constants/dashboard-chart";

// Recharts は JSDOM 環境下で ResizeObserver 等の影響により描画が不安定になりやすいため、
// 子コンポーネントの DashboardBarChart をモック化してUIテストの関心事（ヘッダー等の表示）に集中させる
vi.mock("./dashboard-bar-chart", () => ({
  DashboardBarChart: () => <div data-testid="mock-bar-chart" />,
}));

// useDashboardChart カスタムフックをモック化して内部の非同期通信をスキップ
vi.mock("../../hooks/use-dashboard-chart", () => ({
  useDashboardChart: () => ({
    params: { period: "MONTH" },
    changeParams: vi.fn(),
    data: undefined,
  }),
}));

// テスト用の疑似グラフデータ
const mockInitialChart: DashboardChartResponse = {
  chartType: DASHBOARD_CHART_TYPE.MAINTENANCE_COST_TREND,
  periodType: PERIOD_TYPE.MONTH,
  startPeriod: "2026-07",
  endPeriod: "2026-07",
  canMoveBackward: true,
  canMoveForward: false,
  items: [
    {
      period: "2026-07",
      totalValue: 300000,
      breakdown: [],
    },
  ],
};

/**
 * ダッシュボードグラフ全体コンポーネントの単体テスト
 */
describe("DashboardChart", () => {
  /**
   * @test 初期データを受け取ってコンポーネントがエラーなくマウントされ、タイトルとグラフ領域が表示されることを確認
   */
  test("コンポーネントが正常にレンダリングされ、タイトルが表示される", () => {
    render(
      <DashboardChart
        title="整備費用推移"
        initialChart={mockInitialChart}
        valueType="currency"
        totalLabel="合計費用"
      />,
    );

    // タイトルが表示されていることを検証
    expect(screen.getByText("整備費用推移")).toBeInTheDocument();

    // モック化したバーチャート描画領域が存在することを検証
    expect(screen.getByTestId("mock-bar-chart")).toBeInTheDocument();
  });
});
